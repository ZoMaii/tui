let bridge, bridge_json, seo;

try{
    // 动态加载模块，不存在会直接进入catch
    const MaicQCR = await import('MaicQCR');
    ({ bridge, bridge_json } = MaicQCR);

    // 模块存在再执行桥接逻辑
    seo = bridge?.python("127.0.0.1", 8080).connect("seo");
}
catch(e)
{
    document.body.innerText = `MaicQCR 模块缺失，无法启动Python桥接，尝试使用遍历作为 SSG 的备用方案来避免 SEO 相关信息的缺位！\n 行为参考项目根目录下的 Config.json 文件 \n\nError: ${e}`;
}

// 只有导入成功才执行发送逻辑
if (seo) {
    try {
        seo.send(bridge_json("api@Jinja", {
            "file": "/index.html",
            "source": document,
            "style": "vue",
            "doc": null,
            "config": "/Config.json"
        }, "seo.xml"));
    } catch (sendErr) {
        document.body.innerText = `任务托管出现了问题！ \n Error: ${sendErr}`;
    }
}