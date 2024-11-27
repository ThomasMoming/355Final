let boolConversionCount = 0; // 在全局或回调函数外定义计数器
document.addEventListener("DOMContentLoaded", async function () {
    const svg = d3.select("#animation-box");
    const width = parseInt(svg.style("width"));
    const height = parseInt(svg.style("height"));
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chartGroup = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // 加载 CSV 数据并进行预处理
    const data = await d3.csv("data.set/cyberpunk_2077_filtered.csv", d => {
        if (!d.updated || typeof d.voted_up === "undefined") {
            console.warn("Skipping invalid row:", d);
            return null; // 过滤无效数据
        }

        // 预处理步骤：将各种格式的 voted_up 转换为标准布尔值
        const voted_up = d.voted_up === "TRUE" || d.voted_up === "1" || d.voted_up === true;
        if (typeof voted_up === "boolean") {
            boolConversionCount++; // 成功转换时增加计数
        }
        return {
            date: new Date(d.updated.split(" ")[0]), // 提取日期并转换为 Date 对象
            voted_up: voted_up // 标准化为布尔值
        };
    }).then(data => data.filter(d => d !== null)); // 过滤掉无效数据

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

    // 设置比例尺
    const xScale = d3
        .scaleTime()
        .domain(d3.extent(formattedData, d => d.date))
        .range([0, innerWidth]);

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

    // 添加柱状图
    const barWidth = innerWidth / formattedData.length / 3; // 计算每组柱状的宽度

    chartGroup
        .selectAll(".bar-positive")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("class", "bar-positive")
        .attr("x", d => xScale(d.date) - barWidth)
        .attr("y", d => yScale(d.positive))
        .attr("width", barWidth)
        .attr("height", d => innerHeight - yScale(d.positive))
        .attr("fill", "green");

    chartGroup
        .selectAll(".bar-negative")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("class", "bar-negative")
        .attr("x", d => xScale(d.date))
        .attr("y", d => yScale(d.negative))
        .attr("width", barWidth)
        .attr("height", d => innerHeight - yScale(d.negative))
        .attr("fill", "red");

    // 添加图例
    const legend = svg.append("g").attr("transform", `translate(${width - 150}, ${margin.top})`);
    legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "green");
    legend.append("text").attr("x", 25).attr("y", 15).text("Positive").style("font-size", "12px");

    legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "red");
    legend.append("text").attr("x", 25).attr("y", 45).text("Negative").style("font-size", "12px");

    console.log("Positive Reviews Count:", data.filter(d => d.voted_up).length);
    console.log("Negative Reviews Count:", data.filter(d => !d.voted_up).length);
});
