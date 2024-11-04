const organization = "{{SONARCLOUD_ORG_KEY}}";  // Replace with your SonarCloud organization key
const metrics = "coverage,bugs,vulnerabilities,code_smells,sqale_index,complexity";

async function fetchSonarProjects() {
    try {
        const response = await fetch(`https://sonarcloud.io/api/components/search_projects?organization=${organization}`);
        const data = await response.json();

        const projects = data.components.map(project => project.key);

        const leaderboard = await Promise.all(projects.map(async (projectKey) => {
            const response = await fetch(`https://sonarcloud.io/api/measures/component?component=${projectKey}&metricKeys=${metrics}`);
            const projectData = await response.json();

            return {
                name: projectData.component.name,
                score: calculateScore(projectData.component.measures)
            };
        }));

        displayLeaderboard(leaderboard.sort((a, b) => b.score - a.score));
    } catch (error) {
        console.error("Error fetching SonarCloud data:", error);
    }
}

function calculateScore(measures) {
    let score = 0;
    const metrics = {};

    measures.forEach(measure => {
        metrics[measure.metric] = parseFloat(measure.value);
    });

    // Code Coverage
    if (metrics.coverage >= 90) score += 20;
    else if (metrics.coverage >= 80) score += 17;
    else if (metrics.coverage >= 70) score += 14;
    else if (metrics.coverage >= 60) score += 10;
    else score += 5;

    // Bugs
    if (metrics.bugs <= 1) score += 15;
    else if (metrics.bugs <= 3) score += 12;
    else if (metrics.bugs <= 6) score += 9;
    else if (metrics.bugs <= 10) score += 5;
    else score += 2;

    // Vulnerabilities
    if (metrics.vulnerabilities === 0) score += 15;
    else if (metrics.vulnerabilities === 1) score += 12;
    else if (metrics.vulnerabilities <= 3) score += 9;
    else if (metrics.vulnerabilities <= 5) score += 5;
    else score += 2;

    // Code Smells
    if (metrics.code_smells <= 10) score += 20;
    else if (metrics.code_smells <= 25) score += 15;
    else if (metrics.code_smells <= 50) score += 10;
    else if (metrics.code_smells <= 100) score += 5;
    else score += 2;

    // Technical Debt (sqale_index, assuming it represents hours)
    if (metrics.sqale_index <= 5) score += 20;
    else if (metrics.sqale_index <= 15) score += 15;
    else if (metrics.sqale_index <= 30) score += 10;
    else if (metrics.sqale_index <= 50) score += 5;
    else score += 2;

    // Code Complexity
    if (metrics.complexity <= 50) score += 10;
    else if (metrics.complexity <= 100) score += 8;
    else if (metrics.complexity <= 200) score += 6;
    else if (metrics.complexity <= 300) score += 4;
    else score += 2;

    return score;
}

function displayLeaderboard(data) {
    const leaderboardDiv = document.getElementById("leaderboard");
    leaderboardDiv.innerHTML = `<table>
        <thead>
            <tr>
                <th>Rank</th>
                <th>Project Name</th>
                <th>Score</th>
            </tr>
        </thead>
        <tbody>
            ${data.map((project, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${project.name}</td>
                    <td>${project.score}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>`;
}

fetchSonarProjects();
