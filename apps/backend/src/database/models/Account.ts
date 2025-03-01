import type { Pojo, RelationMappings } from "objection";
import { memoize } from "lodash-es";

import { Model } from "../util/model.js";
import { mergeSchemas, timestampsSchema } from "../util/schemas.js";
import { GithubAccount } from "./GithubAccount.js";
import { Plan } from "./Plan.js";
import { Project } from "./Project.js";
import { Purchase } from "./Purchase.js";
import { ScreenshotBucket } from "./ScreenshotBucket.js";
import { Team } from "./Team.js";
import { User } from "./User.js";
import { VercelConfiguration } from "./VercelConfiguration.js";
import { invariant } from "@/util/invariant.js";

export type AccountAvatar = {
  getUrl(args: { size?: number }): string | Promise<string> | null;
  initial: string;
  color: string;
};

type AccountSubscription = {
  getActivePurchase(): Promise<Purchase | null>;
  getPlan(): Promise<Plan | null>;
  checkIsFreePlan(): Promise<boolean>;
  checkIsTrialing(): Promise<boolean>;
  checkIsUsageBasedPlan(): Promise<boolean>;
  getCurrentPeriodStartDate(): Promise<Date>;
  getCurrentPeriodEndDate(): Promise<Date>;
  getCurrentPeriodScreenshots(): Promise<number>;
  getCurrentPeriodConsumptionRatio(): Promise<number | null>;
  checkIsOutOfCapacity(): Promise<boolean>;
};

export class Account extends Model {
  static override tableName = "accounts";

  static override jsonSchema = mergeSchemas(timestampsSchema, {
    required: ["slug"],
    properties: {
      userId: { type: ["string", "null"] },
      forcedPlanId: { type: ["string", "null"] },
      stripeCustomerId: { type: ["string", "null"] },
      teamId: { type: ["string", "null"] },
      name: { type: ["string", "null"], maxLength: 40, minLength: 1 },
      slug: {
        type: "string",
        minLength: 1,
        maxLength: 48,
        pattern: "^[-a-z0-9]+$",
      },
      githubAccountId: { type: ["string", "null"] },
      vercelConfigurationId: { type: "string" },
    },
  });

  userId!: string | null;
  forcedPlanId!: string | null;
  teamId!: string | null;
  stripeCustomerId?: string | null;
  name!: string | null;
  slug!: string;
  githubAccountId!: string | null;
  vercelConfigurationId!: string | null;
  gitlabAccessToken!: string | null;

  override $formatDatabaseJson(json: Pojo) {
    json = super.$formatDatabaseJson(json);
    if (json["name"]) {
      json["name"] = json["name"].trim();
    }
    if (json["slug"]) {
      json["slug"] = json["slug"].trim();
    }
    return json;
  }

  static override get relationMappings(): RelationMappings {
    return {
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: "accounts.userId",
          to: "users.id",
        },
      },
      team: {
        relation: Model.HasOneRelation,
        modelClass: Team,
        join: {
          from: "accounts.teamId",
          to: "teams.id",
        },
      },
      githubAccount: {
        relation: Model.HasOneRelation,
        modelClass: GithubAccount,
        join: {
          from: "accounts.githubAccountId",
          to: "github_accounts.id",
        },
      },
      vercelConfiguration: {
        relation: Model.HasOneRelation,
        modelClass: VercelConfiguration,
        join: {
          from: "accounts.vercelConfigurationId",
          to: "vercel_configurations.id",
        },
      },
      purchases: {
        relation: Model.HasManyRelation,
        modelClass: Purchase,
        join: {
          from: "accounts.id",
          to: "purchases.accountId",
        },
      },
      projects: {
        relation: Model.HasManyRelation,
        modelClass: Project,
        join: {
          from: "accounts.id",
          to: "projects.accountId",
        },
      },
    };
  }

  user?: User | null;
  team?: Team | null;
  githubAccount?: GithubAccount | null;
  vercelConfiguration?: VercelConfiguration | null;
  purchases?: Purchase[];
  projects?: Project[];
  activePurchase?: Purchase | null;

  _cachedSubscription?: AccountSubscription;

  static override virtualAttributes = ["type"];

  get type() {
    if (this.userId && this.teamId) {
      throw new Error(`Invariant incoherent account type`);
    }
    if (this.userId) return "user";
    if (this.teamId) return "team";
    throw new Error(`Invariant incoherent account type`);
  }

  async $checkHasSubscribedToTrial() {
    if (!this.userId) {
      throw new Error("$checkHasSubscribedToTrial can only be called on users");
    }
    const purchaseCount = await Purchase.query()
      .where({ purchaserId: this.userId })
      .whereNotNull("trialEndDate")
      .limit(1)
      .resultSize();
    return purchaseCount > 0;
  }

  $getSubscription(): AccountSubscription {
    if (this._cachedSubscription) {
      return this._cachedSubscription;
    }

    const getActivePurchase = memoize(async () => {
      if (!this.id) return null;
      if (this.forcedPlanId) return null;

      const purchase = await Purchase.query()
        .where("accountId", this.id)
        .whereRaw("?? < now()", "startDate")
        .where((query) =>
          query.whereNull("endDate").orWhereRaw("?? >= now()", "endDate"),
        )
        .withGraphJoined("plan")
        .orderBy("plan.screenshotsLimitPerMonth", "DESC")
        .first();

      return purchase ?? null;
    });

    const getPlan = memoize(async () => {
      if (this.forcedPlanId) {
        const plan = await Plan.query().findById(this.forcedPlanId);
        return plan ?? null;
      }
      const activePurchase = await getActivePurchase();
      if (activePurchase) {
        return activePurchase.plan ?? null;
      }
      return Plan.getFreePlan();
    });

    const getCurrentPeriodStartDate = memoize(async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      if (this.forcedPlanId) {
        return startOfMonth;
      }
      const purchase = await getActivePurchase();
      return purchase?.startDate ? purchase.getLastResetDate() : startOfMonth;
    });

    const getCurrentPeriodEndDate = memoize(async () => {
      const [startDate, activePurchase, trialing] = await Promise.all([
        getCurrentPeriodStartDate(),
        getActivePurchase(),
        checkIsTrialing(),
      ]);

      if (trialing) {
        invariant(activePurchase?.trialEndDate);
        return new Date(activePurchase.trialEndDate);
      }

      const now = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      return new Date(
        Math.min(
          endDate.getTime(),
          new Date(now.getFullYear(), now.getMonth() + 2, 0).getTime(),
        ),
      );
    });

    const getCurrentPeriodScreenshots = memoize(async () => {
      const startDate = await getCurrentPeriodStartDate();
      return this.$getScreenshotCountFromDate(startDate.toISOString());
    });

    const checkIsFreePlan = memoize(async () => {
      const plan = await getPlan();
      return Plan.checkIsFreePlan(plan);
    });

    const checkIsTrialing = memoize(async () => {
      const activePurchase = await getActivePurchase();
      return activePurchase?.$isTrialActive() ?? false;
    });

    const checkIsUsageBasedPlan = memoize(async () => {
      const plan = await getPlan();
      return Boolean(plan?.usageBased);
    });

    const getCurrentPeriodConsumptionRatio = memoize(async () => {
      const [plan, screenshotsCount] = await Promise.all([
        getPlan(),
        getCurrentPeriodScreenshots(),
      ]);
      const monthlyLimit = Plan.getScreenshotMonthlyLimitForPlan(plan);
      if (monthlyLimit === null) {
        return null;
      }
      return screenshotsCount / monthlyLimit;
    });

    const checkIsOutOfCapacity = memoize(async () => {
      const [usageBased, trialing, consumptionRatio] = await Promise.all([
        checkIsUsageBasedPlan(),
        checkIsTrialing(),
        getCurrentPeriodConsumptionRatio(),
      ]);
      if (!usageBased && !trialing) return false;
      if (consumptionRatio === null) return false;
      return consumptionRatio >= 1.1;
    });

    this._cachedSubscription = {
      getActivePurchase,
      getPlan,
      checkIsFreePlan,
      checkIsTrialing,
      checkIsUsageBasedPlan,
      getCurrentPeriodStartDate,
      getCurrentPeriodEndDate,
      getCurrentPeriodScreenshots,
      getCurrentPeriodConsumptionRatio,
      checkIsOutOfCapacity,
    };

    return this._cachedSubscription;
  }

  async $getScreenshotCountFromDate(
    from: string,
    options?: {
      projectId?: string;
    },
  ): Promise<number> {
    const query = ScreenshotBucket.query()
      .sum("screenshot_buckets.screenshotCount as total")
      .leftJoinRelated("project.githubRepository")
      .where("screenshot_buckets.createdAt", ">=", from)
      .where("project.accountId", this.id)
      .first();

    if (options?.projectId) {
      query.where("project.id", options.projectId);
    }

    const result = (await query) as unknown as { total: string | null };
    return result.total ? Number(result.total) : 0;
  }

  async $checkWritePermission(user: User) {
    return Account.checkWritePermission(this, user);
  }

  static async checkWritePermission(account: Account, user: User) {
    if (!user) return false;
    switch (account.type) {
      case "user":
        return User.checkWritePermission(account.userId as string, user);
      case "team":
        return Team.checkWritePermission(account.teamId as string, user);
      default:
        throw new Error(`Invariant incoherent account type`);
    }
  }

  async $checkReadPermission(user: User) {
    return Account.checkReadPermission(this, user);
  }

  static async checkReadPermission(account: Account, user: User) {
    if (!user) return false;
    switch (account.type) {
      case "user":
        return User.checkReadPermission(account.userId as string, user);
      case "team":
        return Team.checkReadPermission(account.teamId as string, user);
      default:
        throw new Error(`Invariant incoherent account type`);
    }
  }
}
