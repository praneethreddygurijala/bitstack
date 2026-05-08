const apiKey = 'c6a7976db43635102312d399b80c929afd6aaf8c98dde7a33920be22e1375167';
fetch(`https://serpapi.com/search.json?engine=google_local&q=best+restaurant+in+Bangalore&api_key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    const top = data.local_results.slice(0, 2);
    console.log(JSON.stringify(top, null, 2));
  });
