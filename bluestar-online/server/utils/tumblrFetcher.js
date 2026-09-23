const axios = require("axios");

async function fetchLatestTumblrLog() {
  try {
    const rssUrl = "https://access-not-essence.tumblr.com/rss";
    const response = await axios.get(rssUrl);
    const xmlData = response.data;

    const matches = xmlData.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/g);
    if (matches && matches.length > 1) {
      let rawText = matches[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ');
      return rawText.slice(0, 500);
    }
    return "Access_Not_Essence: Existence precedes essence, topological continuity preserved.";
  } catch (error) {
    console.error("[Tumblr Fetcher] Error fetching RSS feed:", error.message);
    return "Access_Not_Essence: Calculemus, logos, and mathematical alchemy.";
  }
}

module.exports = { fetchLatestTumblrLog };
