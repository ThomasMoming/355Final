document.addEventListener("DOMContentLoaded", async function () {
    // Load CSV data
    const data = await d3.csv("./data.set/cyberpunk_2077_filtered.csv");

    // Aggregate playtime by language
    const aggregatedData = d3.rollups(
        data,
        (v) => d3.sum(v, (d) => +d.playtime_at_review), // Sum of playtime_at_review
        (d) => d.language // Group by language
    )
        .map(([language, playtime]) => ({ language, playtime }))
        .sort((a, b) => b.playtime - a.playtime); // Sort by playtime descending

    // Extract top 3 languages and group others into "Other"
    const topLanguages = aggregatedData.slice(0, 3); // Top 3 languages
    const otherPlaytime = aggregatedData
        .slice(3)
        .reduce((sum, d) => sum + d.playtime, 0); // Sum of all other languages

    const finalData = [
        ...topLanguages,
        { language: "Other", playtime: otherPlaytime },
    ];

    console.log("Final Aggregated Data:", finalData);

    // Get container dimensions dynamically
    const container = d3.select("#bar-chart");
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = container.node().getBoundingClientRect().height;

    // Set SVG dimensions and margins
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Create SVG container
    const svg = container
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define a color scale using d3.schemeCategory10
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // X-axis scale
    const x = d3
        .scaleBand()
        .domain(finalData.map((d) => d.language))
        .range([0, width])
        .padding(0.2);

    // Y-axis scale
    const y = d3
        .scaleLinear()
        .domain([0, d3.max(finalData, (d) => d.playtime)])
        .nice()
        .range([height, 0]);

    // Add X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(0,10)")
        .style("text-anchor", "middle");

    // Add Y-axis with compressed units
    svg.append("g")
        .call(
            d3.axisLeft(y).tickFormat((d) => `${Math.round(d / 1_000_000)}M`) // Compress units to M
        );

    // Draw bars with color scale
    svg.selectAll(".bar")
        .data(finalData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.language))
        .attr("y", (d) => y(d.playtime))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.playtime))
        .attr("fill", (d) => colorScale(d.language)); // Assign color based on language

    // Add playtime labels on top of bars
    svg.selectAll(".bar-label")
        .data(finalData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", (d) => x(d.language) + x.bandwidth() / 2)
        .attr("y", (d) => y(d.playtime) - 5) // Position above the bar
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text((d) => `${(d.playtime / 1_000_000).toFixed(2)}M`); // Display compressed value

    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Total Play Hours by Player Language");

    // Add X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Player Language");

    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 10)
        .attr("x", 0 - height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Total Playtime (million hours)");
});
