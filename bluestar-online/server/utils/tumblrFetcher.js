import axios from "axios";

export async function fetchLatestTumblrLog() {
  try {
    const rssUrl = "https://access-not-essence.tumblr.com/rss";
    const response = await axios.get(rssUrl);
    const xmlData = response.data;

    // Extract content within <description> or <content:encoded>
    const matches = xmlData.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/g);
    if (matches && matches.length > 1) {
      // Clean HTML tags from the latest post
      let rawText = matches[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ');
      return rawText.slice(0, 500); // Take first 500 characters
    }
    return "Access_Not_Essence: Existence precedes essence, topological continuity preserved.";
  } catch (error) {
    console.error("[Tumblr Fetcher] Error fetching RSS feed:", error.message);
    return "Access_Not_Essence: Calculemus, logos, and mathematical alchemy.";
  }
}
