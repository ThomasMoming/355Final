document.addEventListener("DOMContentLoaded", async function () {
    // 加载数据
    const data = await d3.csv("./data.set/cyberpunk2077_steamcharts.csv");
    const parsedData = data.map(d => ({
        time: d.Month, // 使用 Month 列作为 X 轴刻度
        year: d.Month.split(" ")[1], // 提取年份
        players: +d["Avg. Players"].replace(/,/g, "") // 转换 Avg. Players 为数值
    }));

    // 关键节点
    const keyNodes = ["Last 30 Days", "February 2024", "February 2023", "February 2022", "February 2021"];

    // 容器尺寸
    const container = d3.select("#timeline-box");
    const containerWidth = container.node().getBoundingClientRect().width;
    const containerHeight = 500;

    // 设置主图和刷选图的边距和尺寸
    const margin = { top: 20, right: 100, bottom: 80, left: 60 };
    const focusHeight = 350; // 主图高度
    const contextHeight = 50; // 滑动选择图高度
    const width = containerWidth - margin.left - margin.right;

    // 创建 SVG 容器
    const svg = container
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight);

           /*調整背景顏色*/
           svg.append("rect")
           .attr("x", 0)
           .attr("y", 0)
           .attr("width", containerWidth)
           .attr("height", containerHeight)
           .attr("fill", "#F7F7F7");

    // 主图和刷选图组
    const focus = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    const context = svg
        .append("g")
        .attr(
            "transform",
            `translate(${margin.left},${margin.top + focusHeight + 20})`
        );

    // X 和 Y 比例尺
    const xScale = d3
        .scaleBand()
        .domain(parsedData.map(d => d.time))
        .range([0, width])
        .padding(0.1);

    const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(parsedData, d => d.players)])
        .nice()
        .range([focusHeight, 0]);

    const xScaleContext = d3
        .scaleBand()
        .domain(parsedData.map(d => d.time))
        .range([0, width])
        .padding(0.1);

    const yScaleContext = d3
        .scaleLinear()
        .domain(yScale.domain())
        .range([contextHeight, 0]);

    // 主图的 X 和 Y 轴
    focus
        .append("g")
        .attr("transform", `translate(0,${focusHeight})`)
        .call(
            d3.axisBottom(xScale)
                .tickValues(xScale.domain().filter((_, i) => !(i % Math.ceil(parsedData.length / 10)))) // 动态调整刻度
                .tickFormat((d, i) => (i % 2 === 0 ? d : "")) // 动态省略部分标签
        )
        .selectAll("text")
        .style("text-anchor", "end");

    focus.append("g").call(d3.axisLeft(yScale));
 

    // 主图线条生成器
    const lineGenerator = d3
        .line()
        .x(d => xScale(d.time) + xScale.bandwidth() / 2)
        .y(d => yScale(d.players));

    // 绘制主图折线
    focus
        .append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "#7fccf5")
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

    // 滑动选择图的 X 和 Y 轴
    context
        .append("g")
        .attr("transform", `translate(0,${contextHeight})`)
        .call(
            d3.axisBottom(xScaleContext)
                .tickValues(keyNodes) // 设置关键节点
                .tickFormat(d => d) // 保留关键节点文本
        );

    context.append("g").call(d3.axisLeft(yScaleContext).ticks(2));

    // 滑动选择图线条生成器
    const lineGeneratorContext = d3
        .line()
        .x(d => xScaleContext(d.time) + xScaleContext.bandwidth() / 2)
        .y(d => yScaleContext(d.players));

    // 绘制滑动选择图折线
    context
        .append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("d", lineGeneratorContext);

    // 添加刷选交互
    const brush = d3
        .brushX()
        .extent([[0, 0], [width, contextHeight]])
        .on("brush end", event => {
            const selection = event.selection;
            if (selection) {
                const [x0, x1] = selection;
                const selectedDomain = xScaleContext.domain().filter(d => {
                    const xPos = xScaleContext(d) + xScaleContext.bandwidth() / 2;
                    return xPos >= x0 && xPos <= x1;
                });
                xScale.domain(selectedDomain);
                updateFocusChart(parsedData.filter(d => selectedDomain.includes(d.time)));
            }
        });

    context.append("g").call(brush);

    // 鼠标悬停显示数据点
    const updateFocusPoints = filteredData => {
        focus.selectAll(".dot").remove();
        focus.selectAll(".dot")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.time) + xScale.bandwidth() / 2)
            .attr("cy", d => yScale(d.players))
            .attr("r", 4)
            .attr("fill", "#7fccf5")
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget).attr("fill", "yellow").attr("r", 6);
                tooltip
                    .style("visibility", "visible")
                    .html(`<strong>${d.time}</strong><br>Players: ${d.players.toLocaleString()}`);
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget).attr("fill", "#7fccf5").attr("r", 4);
                tooltip.style("visibility", "hidden");
            });
        };

     // 工具提示容器
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("font-size", "12px");


    // 按钮容器
    const buttonContainer = svg
        .append("g")
        .attr("transform", `translate(${width + margin.right - 30}, 10)`);

    // 添加年份按钮
    ["2021", "2022", "2023", "2024"].forEach((year, i) => {
        buttonContainer
        .append("rect")
        .attr("x", 0)
        .attr("y", i * 40) // 增加按钮之间的间隔
        .attr("width", 60) // 按钮宽度
        .attr("height", 30) // 按钮高度
        .attr("rx", 5) // 圆角半径
        .attr("ry", 5) // 圆角半径
        .style("fill", "#f0f0f0") // 按钮背景色
        .style("stroke", "#ccc") // 按钮边框颜色
        .style("stroke-width", 1);

        buttonContainer
        .append("text")
        .attr("x", 30) // 文本居中
        .attr("y", i * 40 + 20) // 与矩形匹配，并垂直居中
        .attr("class", "year-button")
        .style("cursor", "pointer")
        .style("font-size", "12px")
        .style("fill", "black")
        .style("text-anchor", "middle") // 文本水平居中
        .text(year)
        .on("click", () => filterByYear(year));
    });

    // 按年份过滤数据
    function filterByYear(year) {
        const filteredData = parsedData.filter(d => d.year === year);
        xScale.domain(filteredData.map(d => d.time));
        updateFocusChart(filteredData);
    }

    // 更新主图的函数
    function updateFocusChart(filteredData) {
        focus.selectAll("path").remove();
        focus
            .append("path")
            .datum(filteredData)
            .attr("fill", "none")
            .attr("stroke", "#7fccf5")
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);

        focus.select("g")
            .call(
                d3.axisBottom(xScale)
                    .tickValues(xScale.domain().filter((_, i) => !(i % Math.ceil(filteredData.length / 10))))
                    .tickFormat((d, i) => (i % 2 === 0 ? d : ""))
            )
            .selectAll("text")
            .style("text-anchor", "end");

        updateFocusPoints(filteredData);
    }

    // 初始数据点
    updateFocusPoints(parsedData);
});
