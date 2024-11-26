document.addEventListener("DOMContentLoaded", async function () {
    console.log("map.js loaded");

    // 1. 加载 GeoJSON 世界地图数据
    const geoJSONUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
    const geoJSONData = await d3.json(geoJSONUrl);
    console.log("GeoJSON Data Loaded:", geoJSONData);

    // 2. 解析 CSV 文件（语言分布数据）
    const csvData = await d3.csv("./data.set/cyberpunk_2077_filtered.csv"); // 替换为实际文件路径
    console.log("CSV Data Loaded:", csvData);
    d3.csv("data.set/cyberpunk2077_steamcharts.csv").then(data => {
        console.log(data); // 检查加载的数据
    }).catch(error => {
        console.error("Error loading CSV:", error);
    });
    // 统计每种语言的评论数量
    const languageCounts = d3.rollups(
        csvData,
        v => v.length,
        d => d.language
    );
    console.log("Language Counts:", languageCounts);

    // 动态获取 SVG 容器宽高
    const container = document.getElementById("map-box");
    if (!container) {
        console.error("SVG container with id 'map-box' not found.");
        return;
    }
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 设置投影和路径生成器
    const projection = d3.geoMercator().fitSize([width, height], geoJSONData); // 动态缩放地图以适应容器
    const path = d3.geoPath().projection(projection);

    // 创建 SVG 容器
    const svg = d3
        .select("#map-box")
        .attr("width", width)
        .attr("height", height);

    // 添加裁剪路径，限制地图渲染范围
    const defs = svg.append("defs");
    defs.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    // 添加分组，并应用裁剪路径
    const mapGroup = svg.append("g").attr("clip-path", "url(#clip)");

    // 添加缩放和拖拽功能
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) // 缩放范围
        .translateExtent([[0, 0], [width, height]]) // 限制拖拽范围到 SVG 容器
        .on("zoom", function (event) {
            mapGroup.attr("transform", event.transform); // 应用缩放和平移
        });

    svg.call(zoom); // 应用缩放行为

    // 3. 渲染世界地图
    mapGroup.selectAll("path")
        .data(geoJSONData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#ccc") // 地图填充色
        .attr("stroke", "#333") // 地图边界色
        .attr("stroke-width", 0.5);

    // 语言分布到国家/区域
    const languageMapping = {
        english: [-98.35, 39.50], // 美国经纬度
        french: [2.2137, 46.2276], // 法国经纬度
        schinese: [104.1954, 35.8617], // 中国经纬度
        korean: [127.7669, 35.9078], // 韩国经纬度
        spanish: [-3.7038, 40.4168], // 西班牙经纬度（马德里）
        russian: [37.6173, 55.7558], // 俄罗斯经纬度（莫斯科）
        turkish: [35.2433, 39.9208], // 土耳其经纬度（安卡拉）
        german: [10.4515, 51.1657], // 德国经纬度
        italian: [12.5674, 41.8719], // 意大利经纬度
        brazilian: [-47.9292, -15.7801], // 巴西经纬度（巴西利亚）
        portuguese: [-8.2245, 39.3999], // 葡萄牙经纬度
        ukrainian: [30.5234, 50.4501], // 乌克兰经纬度（基辅）
        norwegian: [10.7522, 59.9139], // 挪威经纬度（奥斯陆）
        polish: [19.1451, 51.9194], // 波兰经纬度
        thai: [100.9925, 15.8700], // 泰国经纬度
        finnish: [25.7482, 61.9241], // 芬兰经纬度
        japanese: [138.2529, 36.2048], // 日本经纬度
        czech: [14.4378, 50.0755], // 捷克经纬度（布拉格）
        danish: [12.5683, 55.6761], // 丹麦经纬度（哥本哈根）
        hungarian: [19.0402, 47.4979], // 匈牙利经纬度（布达佩斯）
        dutch: [4.9041, 52.3676], // 荷兰经纬度（阿姆斯特丹）
        latam: [-99.1332, 19.4326], // 拉丁美洲代表位置（墨西哥城）
        swedish: [18.0632, 59.3346], // 瑞典经纬度（斯德哥尔摩）
        vietnamese: [106.6602, 10.7626], // 越南经纬度（胡志明市）
        indonesian: [106.8456, -6.2088], // 印度尼西亚经纬度（雅加达）
        greek: [23.7275, 37.9838], // 希腊经纬度（雅典）
        bulgarian: [23.3219, 42.6977], // 保加利亚经纬度（索非亚）
    };

    // 4. 绘制语言分布点
    languageCounts.forEach(([language, count]) => {
        const coord = languageMapping[language];
        if (coord) {
            const [long, lat] = coord;
            const [x, y] = projection([long, lat]);

            mapGroup.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", Math.sqrt(count) / 150 + 0.5) // 按比例缩小点的大小
                .attr("fill", "yellow")
                
                .on("mouseover", function () {
                    d3.select(this).attr("fill", "white");
                    tooltip.style("visibility", "visible")
                        .text(`${language}: ${count} comments`);
                })
                .on("mousemove", function (event) {
                    tooltip.style("top", (event.pageY - 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this).attr("fill", "yellow");
                    tooltip.style("visibility", "hidden");
                });
        }
    });

    // 添加提示框
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "3px")
        .style("visibility", "hidden");

    console.log("Map rendering complete.");
});
