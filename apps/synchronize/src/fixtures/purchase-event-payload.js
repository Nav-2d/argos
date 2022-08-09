export const PURCHASE_EVENT_PAYLOAD = {
  action: 'purchased',
  effective_date: '2022-08-04T00:00:00+00:00',
  sender: {
    login: 'jsfez',
    id: 15954562,
    node_id: 'MDQ6VXNlcjE1OTU0NTYy',
    avatar_url: 'https://avatars.githubusercontent.com/u/15954562?v=4',
    gravatar_id: '',
    url: 'https://api.github.com/users/jsfez',
    html_url: 'https://github.com/jsfez',
    followers_url: 'https://api.github.com/users/jsfez/followers',
    following_url: 'https://api.github.com/users/jsfez/following{/other_user}',
    gists_url: 'https://api.github.com/users/jsfez/gists{/gist_id}',
    starred_url: 'https://api.github.com/users/jsfez/starred{/owner}{/repo}',
    subscriptions_url: 'https://api.github.com/users/jsfez/subscriptions',
    organizations_url: 'https://api.github.com/users/jsfez/orgs',
    repos_url: 'https://api.github.com/users/jsfez/repos',
    events_url: 'https://api.github.com/users/jsfez/events{/privacy}',
    received_events_url: 'https://api.github.com/users/jsfez/received_events',
    type: 'User',
    site_admin: false,
    email: 'jeremy@smooth-code.com',
  },
  marketplace_purchase: {
    account: {
      type: 'User',
      id: 15954562,
      node_id: 'MDQ6VXNlcjE1OTU0NTYy',
      login: 'jsfez',
      organization_billing_email: null,
    },
    billing_cycle: 'monthly',
    unit_count: 1,
    on_free_trial: false,
    free_trial_ends_on: null,
    next_billing_date: null,
    plan: {
      id: 7766,
      name: 'Free',
      description: 'Unlimited screenshots diff for free.',
      monthly_price_in_cents: 0,
      yearly_price_in_cents: 0,
      price_model: 'free',
      has_free_trial: false,
      unit_name: null,
      bullets: [],
    },
  },
}
