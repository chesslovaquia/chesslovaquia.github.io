async function getHugoLatestVersion() {
	const url = "https://api.github.com/repos/gohugoio/hugo/releases/latest";

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data = await response.json();
		let version = data.tag_name;

		// Remove 'v' prefix if present
		if (version.startsWith('v')) {
			version = version.substring(1);
		}

		return version;

	} catch (error) {
		console.error('Error fetching release info:', error);
		return null;
	}
}

// Usage
getHugoLatestVersion().then(version => {
	if (version) {
		console.log(version);
	} else {
		process.exit(1);
	}
});
