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





document.addEventListener("DOMContentLoaded", function () {
    console.log("timeline.js loaded");

    // Timeline 数据
    const timelineData = [
        { date: "April 14, 2022", sales: 18 },
        { date: "Sep 28, 2022", sales: 20 },
        { date: "Dec 20, 2022", sales: 13 },
        { date: "Oct 5, 2023", sales: 25 },
    ];

    console.log("Timeline Data:", timelineData);

    // 动态获取 SVG 容器宽度和高度
    const timelineContainer = document.getElementById("timeline-box");
    if (!timelineContainer) {
        console.error("SVG container with id 'timeline-box' not found.");
        return;
    }
    const timelineWidth = timelineContainer.clientWidth || 500;
    const timelineHeight = timelineContainer.clientHeight || 350;
    console.log("Timeline container dimensions:", { timelineWidth, timelineHeight });

    // 设置图表宽高和边距
    const timelineMargin = { top: 50, right: 20, bottom: 50, left: 70 };
    const timelineInnerWidth = timelineWidth - timelineMargin.left - timelineMargin.right;
    const timelineInnerHeight = timelineHeight - timelineMargin.top - timelineMargin.bottom;

    // 创建 SVG 容器
    const timelineSvg = d3
        .select("#timeline-box")
        .attr("width", timelineWidth)
        .attr("height", timelineHeight)
        .append("g")
        .attr("transform", `translate(${timelineMargin.left},${timelineMargin.top})`);

    console.log("Timeline SVG container created:", timelineSvg);

    // X轴比例尺（时间）
    const xTimelineScale = d3
        .scalePoint()
        .domain(timelineData.map((d) => d.date))
        .range([0, timelineInnerWidth])
        .padding(0.5);
    console.log("X Scale for timeline:", xTimelineScale.domain(), xTimelineScale.range());

    // Y轴比例尺（销售量）
    const yTimelineScale = d3
        .scaleLinear()
        .domain([0, d3.max(timelineData, (d) => d.sales) * 1.1]) // 给最大值增加空间
        .range([timelineInnerHeight, 0]);
    console.log("Y Scale for timeline:", yTimelineScale.domain(), yTimelineScale.range());

    // 添加 X轴
    timelineSvg.append("g")
        .attr("transform", `translate(0, ${timelineInnerHeight})`)
        .call(d3.axisBottom(xTimelineScale))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("fill", "white");
    timelineSvg.selectAll(".domain, .tick line")
        .attr("stroke", "white"); // 刻度尺颜色
    console.log("Timeline X Axis added");

    // 添加 Y轴
    timelineSvg.append("g")
        .call(d3.axisLeft(yTimelineScale).ticks(5))
        .selectAll("text")
        .style("fill", "white");
    timelineSvg.selectAll(".domain, .tick line")
        .attr("stroke", "white"); // 刻度尺颜色
    console.log("Timeline Y Axis added");

    // 绘制折线
    timelineSvg.append("path")
        .datum(timelineData)
        .attr("fill", "none")
        .attr("stroke", "yellow") // 折线颜色
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x((d) => xTimelineScale(d.date))
            .y((d) => yTimelineScale(d.sales))
        );
    console.log("Timeline line path created");

    // 添加数据点
    timelineSvg.selectAll(".dot")
        .data(timelineData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xTimelineScale(d.date))
        .attr("cy", (d) => yTimelineScale(d.sales))
        .attr("r", 5)
        .attr("fill", "white"); // 数据点颜色
    console.log("Timeline dots added");

    // 添加数据点标签
    timelineSvg.selectAll(".label")
        .data(timelineData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d) => xTimelineScale(d.date))
        .attr("y", (d) => yTimelineScale(d.sales) - 10)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .text((d) => d.sales);
    console.log("Timeline labels added");
});




