/* eslint-disable react/no-unescaped-entities */
import * as React from "react";
import { gql } from "graphql-tag";
import { x } from "@xstyled/styled-components";
import { Query } from "../containers/Apollo";
import { useUser } from "../containers/User";
import { isUserSyncing } from "../modules/user";
import config from "../config";
import {
  BaseLink,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardText,
  CardTitle,
  Container,
  Icon,
  Link,
  Loader,
  Menu,
  MenuButton,
  MenuIcon,
  MenuItem,
  MenuSeparator,
  MenuTitle,
  PrimaryTitle,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useMenuState,
  IllustratedText,
  LinkBlock,
  Tag,
  TagButton,
} from "@argos-ci/app/src/components";
import {
  KebabHorizontalIcon,
  LinkExternalIcon,
  KeyIcon,
  GearIcon,
  LockIcon,
  EyeClosedIcon,
  EyeIcon,
} from "@primer/octicons-react";
import { OwnerAvatar } from "../containers/OwnerAvatar";
import { hasWritePermission } from "../modules/permissions";
import {
  BuildStatusBadge,
  BuildStatusBadgeFragment,
} from "../containers/BuildStatusBadge";
import { getBuildStatusLabel } from "../containers/Status";

const HOME_OWNERS_REPOSITORIES_QUERY = gql`
  query HOME_OWNERS_REPOSITORIES_QUERY {
    owners {
      id
      name
      login
      type
      repositories {
        id
        name
        updatedAt
        enabled
        permissions
        builds(first: 1, after: 0) {
          pageInfo {
            totalCount
          }
          edges {
            id
            updatedAt
            number
            ...BuildStatusBadgeFragment
          }
        }
      }
    }
  }

  ${BuildStatusBadgeFragment}
`;

function RepositoryNameCell({
  owner,
  repositoryName,
  repositoryUrl,
  ...props
}) {
  return (
    <Td color="secondary-text" py={5} fontSize="lg" {...props}>
      <Link color="secondary-text" to={`/${owner.login}`} whiteSpace="nowrap">
        <OwnerAvatar
          owner={owner}
          size="sm"
          display="inline-block"
          mr={2}
          mt={-0.5}
        />
        {owner.login}
      </Link>{" "}
      <x.span whiteSpace="nowrap">
        /{" "}
        <Link
          color="primary-text"
          fontWeight={600}
          to={`${repositoryUrl}/builds`}
        >
          {repositoryName}
        </Link>
      </x.span>
    </Td>
  );
}

function ActionsMenuCell({ repository, repositoryUrl }) {
  const menu = useMenuState({ placement: "bottom-end", gutter: 4 });

  return (
    <Td verticalAlign="middle">
      {hasWritePermission(repository) ? (
        <>
          <TagButton as={MenuButton} state={menu} py={2}>
            <Icon as={KebabHorizontalIcon} />
          </TagButton>
          <Menu aria-label="User settings" state={menu}>
            <MenuTitle>Repositories actions</MenuTitle>
            <MenuSeparator />
            <MenuItem
              state={menu}
              as={BaseLink}
              to={`${repositoryUrl}/settings#argos-token`}
            >
              <MenuIcon as={KeyIcon} />
              Get token
            </MenuItem>
            <MenuItem
              state={menu}
              as={BaseLink}
              to={`${repositoryUrl}/settings`}
            >
              <MenuIcon as={GearIcon} size={24} />
              Settings
            </MenuItem>
          </Menu>
        </>
      ) : (
        <>
          <Tag display="block" py={1} color="text-secondary">
            <Icon as={LockIcon} />
          </Tag>
        </>
      )}
    </Td>
  );
}

function BuildTagCell({ build, repositoryUrl, ...props }) {
  if (!build) return <Td>-</Td>;

  return (
    <Td verticalAlign="middle">
      <BuildStatusBadge
        as={LinkBlock}
        to={`${repositoryUrl}/builds/${build.number}`}
        build={build}
        {...props}
      >
        #{build.number} {getBuildStatusLabel(build.status)}
      </BuildStatusBadge>
    </Td>
  );
}

function RepositoriesList({ repositories }) {
  if (repositories.length === 0) {
    return (
      <Container>
        <Card mt={3}>
          <CardHeader>
            <CardTitle>No repository found</CardTitle>
          </CardHeader>
          <CardBody>
            <CardText fontSize="md" mb={3}>
              Argos uses OAuth GitHub App.
            </CardText>
            <CardText fontSize="md">
              <Link href={config.get("github.appUrl")} target="_blank">
                Manage repositories' access restrictions from GitHub{" "}
                <LinkExternalIcon />
              </Link>
            </CardText>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container overflowX="scroll">
      <Table>
        <Thead>
          <Tr>
            <Th>Organization / Repository</Th>
            <Th>Last Build</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {repositories.map(({ owner, ...repository }) => {
            const repositoryUrl = `/${owner.login}/${repository.name}`;
            const lastBuild = repository.builds?.edges?.[0];

            return (
              <Tr key={`${owner.login}-${repository.name}`}>
                <RepositoryNameCell
                  owner={owner}
                  repositoryName={repository.name}
                  repositoryUrl={repositoryUrl}
                />
                <BuildTagCell build={lastBuild} repositoryUrl={repositoryUrl} />
                <Td verticalAlign="middle">
                  <Tag
                    color={
                      repository.enabled ? "primary-text" : "secondary-text"
                    }
                    py={1}
                  >
                    {repository.enabled ? "Active" : "Deactivated"}
                  </Tag>
                </Td>
                <ActionsMenuCell
                  repository={repository}
                  repositoryUrl={repositoryUrl}
                />
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Container>
  );
}

function Owners({ owners }) {
  const repositories = owners
    .flatMap((owner) =>
      owner.repositories.map((repository) => ({ owner, ...repository }))
    )
    .sort((a, b) => (b.enabled === a.enabled ? 0 : b.enabled ? 1 : -1));

  const activeRepositories = repositories.filter(({ enabled }) => enabled);

  const [activeFilter, setActiveFilter] = React.useState(
    activeRepositories.length !== 0
  );

  return (
    <>
      <Container>
        <PrimaryTitle>Organizations and Repositories</PrimaryTitle>

        <x.div
          display="flex"
          justifyContent="space-between"
          alignItems="flex-end"
          flexWrap="wrap"
          columnGap={10}
          rowGap={3}
        >
          <x.div flex="1 0 300px">
            Don't see your repo?{" "}
            <IllustratedText
              as={Link}
              reverse
              href={config.get("github.appUrl")}
              target="_blank"
              fontWeight="normal"
              icon={LinkExternalIcon}
            >
              Manage access restrictions
            </IllustratedText>{" "}
            or{" "}
            <Link onClick={() => window.location.reload()}>
              reload the page
            </Link>
            .
          </x.div>

          <Button
            variant="neutral"
            onClick={() => setActiveFilter((prev) => !prev)}
            alignSelf="end"
          >
            <IllustratedText
              icon={activeFilter ? EyeClosedIcon : EyeIcon}
              field
            >
              {!activeFilter ? "Hide" : "Show"} deactivated repositories
            </IllustratedText>
          </Button>
        </x.div>
      </Container>
      <RepositoriesList
        repositories={activeFilter ? activeRepositories : repositories}
        mt={3}
      />
    </>
  );
}

const RedirectToWww = () => {
  React.useEffect(() => {
    window.location = "https://www.argos-ci.com";
  }, []);
  return null;
};

export function Home() {
  const user = useUser();

  if (!user) {
    if (process.env.NODE_ENV !== "production") {
      return (
        <Container textAlign="center" my={4}>
          Not logged in, in production you would be redirected to
          www.argos-ci.com.
        </Container>
      );
    }
    return <RedirectToWww />;
  }

  if (!user.installations.length && !isUserSyncing(user)) {
    return (
      <Container textAlign="center" my={4}>
        <p>Look like you don't have installed Argos GitHub App.</p>
        <Button as="a" href={config.get("github.appUrl")}>
          Install Argos GitHub App
        </Button>
      </Container>
    );
  }

  return (
    <Query
      fallback={
        <Container my={3} textAlign="center">
          <Loader />
        </Container>
      }
      query={HOME_OWNERS_REPOSITORIES_QUERY}
    >
      {({ owners }) => <Owners owners={owners} />}
    </Query>
  );
}
