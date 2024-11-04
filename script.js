const organization = "{{SONARCLOUD_ORG_KEY}}"; // Placeholder to be replaced by GitHub Action
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
                scoreDetails: calculateScore(projectData.component.measures)
            };
        }));

        displayLeaderboard(leaderboard.sort((a, b) => b.scoreDetails.totalScore - a.scoreDetails.totalScore));
    } catch (error) {
        console.error("Error fetching SonarCloud data:", error);
    }
}

function calculateScore(measures) {
    let scoreDetails = {
        coverageScore: 0,
        bugsScore: 0,
        vulnerabilitiesScore: 0,
        codeSmellsScore: 0,
        technicalDebtScore: 0,
        complexityScore: 0,
        totalScore: 0
    };
    const metrics = {};

    measures.forEach(measure => {
        metrics[measure.metric] = parseFloat(measure.value);
    });

    // Code Coverage Score
    scoreDetails.coverageScore = (metrics.coverage >= 90 ? 20 : metrics.coverage >= 80 ? 17 : metrics.coverage >= 70 ? 14 : metrics.coverage >= 60 ? 10 : 5);
    scoreDetails.totalScore += scoreDetails.coverageScore;

    // Bugs Score
    scoreDetails.bugsScore = (metrics.bugs <= 1 ? 15 : metrics.bugs <= 3 ? 12 : metrics.bugs <= 6 ? 9 : metrics.bugs <= 10 ? 5 : 2);
    scoreDetails.totalScore += scoreDetails.bugsScore;

    // Vulnerabilities Score
    scoreDetails.vulnerabilitiesScore = (metrics.vulnerabilities === 0 ? 15 : metrics.vulnerabilities === 1 ? 12 : metrics.vulnerabilities <= 3 ? 9 : metrics.vulnerabilities <= 5 ? 5 : 2);
    scoreDetails.totalScore += scoreDetails.vulnerabilitiesScore;

    // Code Smells Score
    scoreDetails.codeSmellsScore = (metrics.code_smells <= 10 ? 20 : metrics.code_smells <= 25 ? 15 : metrics.code_smells <= 50 ? 10 : metrics.code_smells <= 100 ? 5 : 2);
    scoreDetails.totalScore += scoreDetails.codeSmellsScore;

    // Technical Debt Score
    scoreDetails.technicalDebtScore = (metrics.sqale_index <= 5 ? 20 : metrics.sqale_index <= 15 ? 15 : metrics.sqale_index <= 30 ? 10 : metrics.sqale_index <= 50 ? 5 : 2);
    scoreDetails.totalScore += scoreDetails.technicalDebtScore;

    // Code Complexity Score
    scoreDetails.complexityScore = (metrics.complexity <= 50 ? 10 : metrics.complexity <= 100 ? 8 : metrics.complexity <= 200 ? 6 : metrics.complexity <= 300 ? 4 : 2);
    scoreDetails.totalScore += scoreDetails.complexityScore;

    return scoreDetails;
}

function displayLeaderboard(data) {
    const leaderboardDiv = document.getElementById("leaderboard");
    leaderboardDiv.innerHTML = `<table>
        <thead>
            <tr>
                <th>Rank</th>
                <th>Project Name</th>
                <th>Score</th>
                <th>Details</th>
            </tr>
        </thead>
        <tbody>
            ${data.map((project, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${project.name}</td>
                    <td>${project.scoreDetails.totalScore}</td>
                    <td>
                        <button onclick="toggleDetails(${index})">Show Breakdown</button>
                        <div id="details-${index}" class="details" style="display: none;">
                            <p><i class="icon-coverage"></i> Coverage: ${project.scoreDetails.coverageScore}</p>
                            <p><i class="icon-bugs"></i> Bugs: ${project.scoreDetails.bugsScore}</p>
                            <p><i class="icon-vulnerabilities"></i> Vulnerabilities: ${project.scoreDetails.vulnerabilitiesScore}</p>
                            <p><i class="icon-code-smells"></i> Code Smells: ${project.scoreDetails.codeSmellsScore}</p>
                            <p><i class="icon-technical-debt"></i> Technical Debt: ${project.scoreDetails.technicalDebtScore}</p>
                            <p><i class="icon-complexity"></i> Complexity: ${project.scoreDetails.complexityScore}</p>
                        </div>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    <p><a href="https://github.com/Learnathon-By-Geeky-Solutions/.github/wiki/sonar-cloud" target="_blank">Scoring Policy</a></p>`;
}

function toggleDetails(index) {
    const detailsDiv = document.getElementById(`details-${index}`);
    detailsDiv.style.display = detailsDiv.style.display === "none" ? "block" : "none";
}

fetchSonarProjects();
