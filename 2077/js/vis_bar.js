document.addEventListener("DOMContentLoaded", function () {
    const data = [
        { language: "Chinese", hours: 50000 },
        { language: "English", hours: 70000 },
        { language: "Other", hours: 20000 },
    ];

    // 设置SVG宽高和边距
    const margin = { top: 30, right: 30, bottom: 40, left: 50 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // 创建SVG
    const svg = d3
        .select("#bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X轴比例尺
    const x = d3
        .scaleBand()
        .domain(data.map((d) => d.language))
        .range([0, width])
        .padding(0.2);

    // Y轴比例尺
    const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.hours)])
        .range([height, 0]);

    // 添加X轴
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(0,10)")
        .style("text-anchor", "middle");

    // 添加Y轴
    svg.append("g").call(d3.axisLeft(y));

    // 绘制条形图
    svg.selectAll("bars")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d) => x(d.language))
        .attr("y", (d) => y(d.hours))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.hours))
        .attr("fill", (d, i) =>
            i === 0 ? "steelblue" : i === 1 ? "orange" : "green"
        );

    // 添加标题
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Total Play Hours by Player Language");
});