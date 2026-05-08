const apiKey = 'c6a7976db43635102312d399b80c929afd6aaf8c98dde7a33920be22e1375167';
fetch(`https://serpapi.com/search.json?engine=google_local&q=movie+OR+music+OR+food+restaurants+vegetarian+in+Bangalore&api_key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    if (data.local_results) {
      data.local_results.slice(0,3).forEach(e => console.log(e.title));
    }
  });
