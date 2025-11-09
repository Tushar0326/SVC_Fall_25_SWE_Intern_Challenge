/**
 * Reddit API Service
 * Handles Reddit API interactions including OAuth and data fetching
 */

interface RedditPost {
  id: string;
  title: string;
  author: string;
  score: number;
  subreddit: string;
  url: string;
  created_utc: number;
}

interface RedditTopResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

/**
 * Get OAuth access token from Reddit
 */
async function getRedditAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Reddit API credentials not configured");
  }

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "FairDataUse/1.0.0",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Reddit OAuth token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get top posts from a Reddit subreddit
 * @param subreddit - The subreddit name (without r/)
 * @param limit - Number of posts to fetch (default: 10)
 * @returns Array of Reddit posts
 */
export async function getTop(
  subreddit: string = "all",
  limit: number = 10
): Promise<RedditPost[]> {
  try {
    const accessToken = await getRedditAccessToken();

    const response = await fetch(
      `https://oauth.reddit.com/r/${subreddit}/top.json?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "FairDataUse/1.0.0",
        },
      }
    );

    if (response.status === 429) {
      throw new Error("Reddit API rate limit exceeded");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reddit API error: ${response.status} - ${errorText}`);
    }

    const data: RedditTopResponse = await response.json();

    return data.data.children.map((child) => child.data);
  } catch (error: any) {
    if (error.message.includes("rate limit")) {
      throw error;
    }
    throw new Error(`Failed to fetch Reddit top posts: ${error.message}`);
  }
}

/**
 * Verify if a Reddit username exists
 */
export async function verifyRedditUser(username: string): Promise<boolean> {
  try {
    const accessToken = await getRedditAccessToken();

    const response = await fetch(
      `https://oauth.reddit.com/user/${username}/about`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "FairDataUse/1.0.0",
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error(`Error verifying Reddit user ${username}:`, error);
    return false;
  }
}

