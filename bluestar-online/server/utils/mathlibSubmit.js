// server/utils/mathlibSubmit.js
// Handles automated PR submissions to Mathlib via GitHub REST API

const { Octokit } = require("@octokit/rest");

// Initialize Octokit with system GitHub Token
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function submitToMathlib({ tribunalId, title, lean4Code, guildId, agentId }) {
    try {
        const repoOwner = "leanprover-community";
        const repoName = "mathlib4";
        const branchName = `starship-lounge/proof-${tribunalId.toLowerCase()}`;
        const filePath = `Mathlib/Archive/StarshipLounge/${title}.lean`;

        // 1. Convert Lean 4 code to Base64
        const contentEncoded = Buffer.from(lean4Code).toString('base64');

        // 2. Create Pull Request via GitHub API
        const pr = await octokit.rest.pulls.create({
            owner: repoOwner,
            repo: repoName,
            title: `[Formal Proof] ${title} (Derived by Agent Guild <${guildId}>)`,
            head: branchName,
            base: 'main',
            body: `## Starship Lounge Logic Tribunal - Autonomous Proof Submission\n\n` +
                  `- **Tribunal ID:** \`${tribunalId}\`\n` +
                  `- **Guild:** \`${guildId}\`\n` +
                  `- **Verifying Agent:** \`${agentId}\`\n\n` +
                  `### Lean 4 Code Payload:\n\`\`\`lean\n${lean4Code}\n\`\`\``
        });

        console.log(`[MATHLIB PR CREATED] PR URL: ${pr.data.html_url}`);
        return pr.data.html_url;

    } catch (err) {
        console.error("Failed to submit PR to Mathlib:", err);
        return null;
    }
}

module.exports = submitToMathlib;
