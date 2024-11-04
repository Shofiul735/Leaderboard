const organization = "{{SONARCLOUD_ORG_KEY}}"; // Placeholder to be replaced by GitHub Action
const metrics = "coverage,bugs,vulnerabilities,code_smells,sqale_index,complexity";
let leaderboardData = [];
let currentSort = { column: null, direction: 'asc' };

async function fetchSonarProjects() {
    try {
        const response = await fetch(`https://sonarcloud.io/api/components/search_projects?organization=${organization}`);
        const data = await response.json();

        const projects = data.components.map(project => project.key);

        leaderboardData = await Promise.all(projects.map(async (projectKey) => {
            const response = await fetch(`https://sonarcloud.io/api/measures/component?component=${projectKey}&metricKeys=${metrics}`);
            const projectData = await response.json();

            return {
                name: projectData.component.name,
                scoreDetails: calculateScore(projectData.component.measures)
            };
        }));

        leaderboardData = leaderboardData.sort((a, b) => b.scoreDetails.totalScore - a.scoreDetails.totalScore);

        leaderboardData.forEach((project, index) => {
            project.rank = index + 1; // Highest score gets rank 1
        });
        
        
        return leaderboardData;
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

$(document).ready(async () => {
    const data = await fetchSonarProjects();

    const table = new DataTable('#score-table',{
        responsive:true,
        data:data,
        columns:[
            {data:'rank',title:'Rank',className: 'dt-center'},
            {data:'name',title:'Name',className: 'dt-center'},
            {data:'scoreDetails.totalScore',title:'Score',className: 'dt-center'},
            {
                data: null,
                title: 'Details',
                orderable: false,
                className: 'dt-center-details',
                render: () => '<button class="show-details-btn btn">Show Details</button>'
            }
        ]
    })

    $('#score-table tbody').on('click', 'button.show-details-btn', function () {
        const tr = $(this).closest('tr');
        const row = table.row(tr);

        if (row.child.isShown()) {
            // Close the row details
            row.child.hide();
            tr.removeClass('shown');
            $(this).text('Show Details');
        } else {
            // Create details HTML with hidden score details
            const rowData = row.data();
            const detailsHtml = `
                <div>
                    <div class="details" style="float: right;">
                        <p><i class="icon-coverage"></i><strong>Code Coverage:</strong> ${rowData.scoreDetails.coverageScore}/20</p>
                        <p><i class="icon-bugs"></i><strong>Bugs:</strong> ${rowData.scoreDetails.bugsScore}/15</p>
                        <p><i class="icon-vulnerabilities"></i><strong>Vulnerabilities:</strong> ${rowData.scoreDetails.vulnerabilitiesScore}/15</p>
                        <p><i class="icon-code-smells"></i><strong>Code Smells:</strong> ${rowData.scoreDetails.codeSmellsScore}/20</p>
                        <p><i class="icon-technical-debt"></i><strong>Technical Debt:</strong> ${rowData.scoreDetails.technicalDebtScore}/20</p>
                        <p><i class="icon-complexity"></i><strong>Complexity Score:</strong> ${rowData.scoreDetails.complexityScore}/10</p>
                    </div>
                </div>
            `;
            row.child(detailsHtml).show();
            tr.addClass('shown');
            $(this).text('Hide Details');
        }
    });

    // Leaderboard cards
    $('#first-score').text(leaderboardData?.[0]?.scoreDetails?.totalScore ?? '')
    $('#first-team').text(leaderboardData?.[0]?.name ?? '')

    $('#second-score').text(leaderboardData?.[1]?.scoreDetails?.totalScore ?? '')
    $('#second-team').text(leaderboardData?.[1]?.name ?? '')

    $('#third-score').text(leaderboardData?.[2]?.scoreDetails?.totalScore ?? '')
    $('#third-team').text(leaderboardData?.[2]?.name ?? '')
})


