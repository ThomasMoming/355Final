let boolConversionCount = 0; // 在全局定义计数器
document.addEventListener("DOMContentLoaded", async function () {
    const svg = d3.select("#animation-box");
    const width = parseInt(svg.style("width"));
    const height = parseInt(svg.style("height"));
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#f7f7f7"); // 背景颜色

    const chartGroup = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // 加载 CSV 数据并进行预处理
    const data = await d3.csv("data.set/cyberpunk_reviews_6month.csv", d => {
        if (!d.timestamp || !d.rating) {
            console.warn("Skipping invalid row:", d);
            return null; // 过滤无效数据
        }

        // 转换 rating 为布尔值
        const voted_up = d.rating === "positive";
        if (typeof voted_up === "boolean") {
            boolConversionCount++; // 成功转换时增加计数
        }
        return {
            date: new Date(d.timestamp.split(" ")[0]), // 提取日期并转换为 Date 对象
            voted_up: voted_up // 标准化为布尔值
        };
    }).then(data => data.filter(d => d !== null)); // 过滤掉无效数据

    console.log("成功转换为布尔值的记录数量:", boolConversionCount);
    console.log("Sample Data:", data.slice(0, 10)); // 检查数据结构

    // 数据分组到每个季度
    const aggregatedData = d3.rollups(
        data,
        group => ({
            positive: group.filter(d => d.voted_up).length,
            negative: group.filter(d => !d.voted_up).length
        }),
        d => {
            const quarter = Math.floor(d.date.getMonth() / 3) + 1; // 计算季度
            return `${d.date.getFullYear()}-Q${quarter}`; // 返回年份和季度
        }
    );

    const formattedData = Array.from(aggregatedData, ([key, value]) => {
        const [year, quarter] = key.split("-Q");
        const month = (parseInt(quarter) - 1) * 3; // 确定季度的起始月份
        return {
            date: new Date(year, month, 1), // 将季度转换为日期
            positive: value.positive,
            negative: value.negative
        };
    });

    console.log("Formatted Data:", formattedData); // 检查格式化数据

    // 动态计算 bar 宽度，确保在数据量较多时不会超出范围
    const barWidth = Math.min(innerWidth / (formattedData.length * 4), 20); // 设置最大宽度为20px
    const barOffset = barWidth; // 定义柱状图的整体偏移量

    // 设置比例尺，留出额外空间
    const xScale = d3
        .scaleTime()
        .domain([
            d3.min(formattedData, d => d.date),
            d3.max(formattedData, d => d.date)
        ])
        .range([barWidth, innerWidth - barWidth]); // 留出柱状图宽度的空间

    const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(formattedData, d => d.positive + d.negative)])
        .nice()
        .range([innerHeight, 0]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(3)) // 每三个月（每季度）一个刻度
        .tickFormat(d3.timeFormat("%Y Q%q")); // 显示为 "年 Q季度"

    const yAxis = d3.axisLeft(yScale).ticks(10);

    // 添加坐标轴
    chartGroup
        .append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(xAxis)
        .selectAll("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-45)");

    chartGroup.append("g").call(yAxis);

    // 添加工具提示框
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("visibility", "hidden");

    // 添加正面柱状图
    const positiveBars = chartGroup
        .selectAll(".bar-positive")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("class", "bar-positive")
        .attr("x", d => xScale(d.date) - barOffset) // 向右偏移
        .attr("y", innerHeight) // 初始位置在底部
        .attr("width", barWidth)
        .attr("height", 0) // 初始高度为0
        .attr("fill", "#7fccf5")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "#FFD700");
        
            let additionalText = ""; // 初始化额外文本
        
            // 根据时间添加额外文本
            if (d3.timeFormat("%Y Q%q")(d.date) === "2022 Q3") {
                additionalText = " - Cyberpunk 2077 Edgewalker released, the game's popularity rises.";
            } else if (d3.timeFormat("%Y Q%q")(d.date) === "2023 Q3") {
                additionalText = " - DLC Phantom Liberty released, positive reviews rising.";
            }
        
            tooltip
                .style("visibility", "visible")
                .html(`Positive: ${d.positive}<br>${additionalText}`); // 显示额外文本
        })
        .on("mousemove", function (event) {
            tooltip
                .style("top", `${event.pageY - 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "#7fccf5");
            tooltip.style("visibility", "hidden");
        });

    // 添加负面柱状图
    const negativeBars = chartGroup
        .selectAll(".bar-negative")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("class", "bar-negative")
        .attr("x", d => xScale(d.date)) // 与正面柱状图偏移不同
        .attr("y", innerHeight) // 初始位置在底部
        .attr("width", barWidth)
        .attr("height", 0) // 初始高度为0
        .attr("fill", "#FFE55B")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "#FFD700");
        
            let additionalText = ""; // 初始化额外文本
        
            // 根据时间添加额外文本
            if (d3.timeFormat("%Y Q%q")(d.date) === "2022 Q3") {
                additionalText = " - Cyberpunk 2077 Edgewalker released, the game's popularity rises.";
            } else if (d3.timeFormat("%Y Q%q")(d.date) === "2023 Q3") {
                additionalText = " - DLC Phantom Liberty released, positive reviews rising.";
            }
        
            tooltip
                .style("visibility", "visible")
                .html(`Negative: ${d.negative}<br>${additionalText}`); // 显示额外文本
        })
        .on("mousemove", function (event) {
            tooltip
                .style("top", `${event.pageY - 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "#FFE55B");
            tooltip.style("visibility", "hidden");
        });

    // 添加图例
    const legend = svg.append("g").attr("transform", `translate(${width - 150}, ${margin.top})`);
    legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#7fccf5");
    legend.append("text").attr("x", 25).attr("y", 15).text("Positive").style("font-size", "12px");

    legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#FFE55B");
    legend.append("text").attr("x", 25).attr("y", 45).text("Negative").style("font-size", "12px");

    // 动画函数
    const animateBars = () => {
        positiveBars.transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr("y", d => yScale(d.positive))
            .attr("height", d => innerHeight - yScale(d.positive));

        negativeBars.transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr("y", d => yScale(d.negative))
            .attr("height", d => innerHeight - yScale(d.negative));
    };

    // 自动播放动画
    animateBars();

    // 在动画部分创建按钮容器
    const buttonContainer = svg
        .append("g")
        .attr("transform", `translate(${width + margin.right - 100}, 10)`); // 调整按钮容器的位置

    // 定义按钮列表
    ["Replay", "Reset"].forEach((action, i) => {
        // 添加按钮背景
        buttonContainer
            .append("rect")
            .attr("x", 0 + 16)
            .attr("y", i * 30) // 增加按钮之间的间隔
            .attr("width", 50) // 按钮宽度
            .attr("height", 25) // 按钮高度
            .attr("rx", 3) // 圆角半径
            .attr("ry", 3) // 圆角半径
            .style("fill", "#e6e6e6") // 按钮背景色
            .style("stroke", "#aaa") // 按钮边框颜色
            .style("stroke-width", 0.5);

        // 添加按钮文本
        buttonContainer
            .append("text")
            .attr("x", 40) // 文本居中
            .attr("y", i * 30 + 17) // 与矩形匹配，并垂直居中
            .style("cursor", "pointer")
            .style("font-size", "12px")
            .style("fill", "black")
            .style("text-anchor", "middle") // 文本水平居中
            .text(action)
            .on("click", () => handleAction(action)); // 根据动作名称调用对应函数
    });

    // 动作处理函数
    const handleAction = (action) => {
        switch (action) {
            case "Replay":
                console.log("Replay button clicked!");
                animateBars(); // 重新播放动画
                break;
            case "Reset":
                console.log("Reset button clicked!");
                // 重置柱状图至初始状态
                d3.selectAll(".bar-positive")
                    .attr("y", innerHeight)
                    .attr("height", 0);

                d3.selectAll(".bar-negative")
                    .attr("y", innerHeight)
                    .attr("height", 0);
                break;
            default:
                console.error("Unknown action:", action);
        }
    };

    console.log("Positive Reviews Count:", data.filter(d => d.voted_up).length);
    console.log("Negative Reviews Count:", data.filter(d => !d.voted_up).length);
});
