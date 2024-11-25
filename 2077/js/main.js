document.addEventListener("DOMContentLoaded", function () {
    console.log("main.js loaded");

    // 数据：PLN 转换为 USD（1 PLN ≈ 0.25 USD）
    const data = [
        { year: 2020, sales: 1404 * 0.25 },
        { year: 2021, sales: 367 * 0.25 },
        { year: 2022, sales: 459 * 0.25 },
        { year: 2023, sales: 826 * 0.25 },
    ];
    console.log("Data:", data);

    // 动态获取 SVG 容器宽度和高度
    const container = document.getElementById("sales-chart");
    if (!container) {
        console.error("SVG container with id 'sales-chart' not found.");
        return;
    }
    const containerWidth = container.clientWidth || 500; // 容器宽度（默认500）
    const containerHeight = container.clientHeight || 350; // 容器高度（默认350）
    console.log("SVG container dimensions:", { containerWidth, containerHeight });

    // 动态设置图表宽高和边距
    const margin = { top: 50, right: 20, bottom: 50, left: 70 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;
    console.log("Chart dimensions after margins:", { width, height, margin });

    // 创建 SVG 容器
const svg = d3
    .select("#sales-chart")
    .attr("width", containerWidth)
    .attr("height", containerHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
console.log("SVG container created:", svg);

// X轴比例尺
const xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.year))
    .range([0, width])
    .padding(0.6);
console.log("X Scale domain and range:", xScale.domain(), xScale.range());

// Y轴比例尺
const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.sales) * 1.1]) // 给最大值增加一些空间
    .range([height, 0]);
console.log("Y Scale domain and range:", yScale.domain(), yScale.range());

// 添加 X轴
svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).tickFormat((d) => d.toString()))
    .attr("color", "white") // 修改轴线和文字为白色
    .selectAll("line") // 选择所有刻度线
    .attr("stroke", "white"); // 修改刻度线为白色

// 添加 Y轴
svg.append("g")
    .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `$${d}M`))
    .attr("color", "white") // 修改轴线和文字为白色
    .selectAll("line") // 选择所有刻度线
    .attr("stroke", "white"); // 修改刻度线为白色

// 验证每个数据点的 x 和 y 是否在范围内
data.forEach((d) => {
    const x = xScale(d.year);
    const y = yScale(d.sales);
    console.log(`Year: ${d.year}, X: ${x}, Y: ${y}, Bandwidth: ${xScale.bandwidth()}, Sales: ${d.sales}`);
    if (x < 0 || x + xScale.bandwidth() > width) {
        console.error(`X value out of bounds for year ${d.year}: ${x}`);
    }
    if (y < 0 || y > height) {
        console.error(`Y value out of bounds for year ${d.year}: ${y}`);
    }
});

// 添加柱状图
const bars = svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.year))
    .attr("y", (d) => yScale(d.sales))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => height - yScale(d.sales))
    .attr("fill", "yellow")
    .each((d) => {
        console.log(`Bar created: Year: ${d.year}, X: ${xScale(d.year)}, Y: ${yScale(d.sales)}, Height: ${height - yScale(d.sales)}`);
    });
console.log("Bars created:", bars);

// 添加柱状图顶部的文字标签
const labels = svg
    .selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d.year) + xScale.bandwidth() / 2)
    .attr("y", (d) => yScale(d.sales) - 5)
    .attr("text-anchor", "middle")
    .text((d) => `$${d.sales.toFixed(2)}M`)
    .each((d) => {
        const x = xScale(d.year) + xScale.bandwidth() / 2;
        const y = yScale(d.sales) - 5;
        console.log(`Label created: Year: ${d.year}, X: ${x}, Y: ${y}`);
    });
console.log("Labels added:", labels);



});


