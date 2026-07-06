const { execSync } = require('child_process');
const readline = require('readline');

// Fetch owner and repo from git remote
function getRepoInfo() {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
    // Matches patterns like:
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    const match = remoteUrl.match(/github\.com[/:]([^/]+)\/([^.]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  } catch (err) {
    console.error('Error fetching git remote url:', err.message);
  }
  return { owner: null, repo: null };
}

const { owner, repo } = getRepoInfo();
if (!owner || !repo) {
  console.error('Could not determine GitHub owner/repo from remote URL. Please ensure you are inside a Git repo with a GitHub remote.');
  process.exit(1);
}

console.log(`Target Repository: ${owner}/${repo}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Please enter your GitHub Personal Access Token (PAT) with repo scope: ', async (token) => {
  if (!token.trim()) {
    console.error('Token is required.');
    rl.close();
    process.exit(1);
  }

  const headers = {
    'Authorization': `token ${token.trim()}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'HiveForge-Setup-Script',
    'Content-Type': 'application/json'
  };

  const milestones = ['MVP', 'Hackathon Submission'];
  const issues = [
    { title: 'Backend', labels: ['Backend'] },
    { title: 'Frontend', labels: ['Frontend'] },
    { title: 'AI Runtime', labels: ['AI Runtime'] },
    { title: 'Hive Core', labels: ['Hive Core'] },
    { title: 'Deployment', labels: ['Deployment'] }
  ];

  // Colors for labels
  const labelColors = {
    'Backend': '4F46E5', // Indigo
    'Frontend': '06B6D4', // Cyan
    'AI Runtime': 'F59E0B', // Amber
    'Hive Core': '10B981', // Emerald
    'Deployment': 'EF4444' // Red
  };

  try {
    // 1. Create Labels
    console.log('\nCreating/verifying GitHub labels...');
    for (const [name, color] of Object.entries(labelColors)) {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/labels`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, color, description: `${name} related issues` })
      });
      if (res.status === 201) {
        console.log(`✅ Label created: ${name}`);
      } else if (res.status === 422) {
        console.log(`ℹ️ Label already exists: ${name}`);
      } else {
        console.log(`❌ Failed to create label ${name}: ${res.statusText} (${res.status})`);
      }
    }

    // 2. Create Milestones
    console.log('\nCreating GitHub Milestones...');
    const createdMilestones = {};
    for (const title of milestones) {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/milestones`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, state: 'open' })
      });
      const data = await res.json();
      if (res.status === 201) {
        console.log(`✅ Milestone created: ${title}`);
        createdMilestones[title] = data.number;
      } else if (res.status === 422) {
        console.log(`ℹ️ Milestone already exists: ${title}`);
        // Let's fetch existing milestone number
        const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/milestones`, { headers });
        const milestoneList = await getRes.json();
        const found = milestoneList.find(m => m.title === title);
        if (found) {
          createdMilestones[title] = found.number;
        }
      } else {
        console.log(`❌ Failed to create milestone ${title}: ${res.statusText}`);
      }
    }

    // 3. Create Issues
    console.log('\nCreating GitHub Issues...');
    for (const issue of issues) {
      const payload = {
        title: issue.title,
        body: `Tracks tasks and updates related to the ${issue.title} module of HiveForge.`,
        labels: issue.labels
      };
      
      // Associate with MVP milestone if it exists
      if (createdMilestones['MVP']) {
        payload.milestone = createdMilestones['MVP'];
      }

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.status === 201) {
        console.log(`✅ Issue created: ${issue.title}`);
      } else {
        console.log(`❌ Failed to create issue ${issue.title}: ${res.statusText}`);
      }
    }

    console.log('\n🎉 GitHub setup completed successfully!');
  } catch (err) {
    console.error('Error setting up GitHub assets:', err);
  } finally {
    rl.close();
  }
});
