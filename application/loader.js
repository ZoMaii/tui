/**
 * 带并发限制的批量请求工具
 */
async function runWithConcurrencyLimit(tasks, limit = 6) {
    const results = [];
    const executing = [];
    for (const task of tasks) {
        const p = task().then(result => {
            executing.splice(executing.indexOf(p), 1);
            return result;
        });
        results.push(p);
        executing.push(p);
        if (executing.length >= limit) {
            await Promise.race(executing);
        }
    }
    return Promise.all(results);
}

/** 加载 manifest 统计信息 */
export async function loadManifest() {
    const response = await fetch('../data/manifest.json');
    if (!response.ok) throw new Error('Manifest 加载失败');
    return response.json();
}

/** 加载单个摘要分页 */
export async function loadSummaryPage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`摘要加载失败: ${url}`);
    return response.json();
}

/** 加载全部摘要（带并发控制） */
export async function loadAllSummaries(manifest, concurrency = 6) {
    const tasks = manifest.summaryPages.map(url => () => loadSummaryPage(url));
    const pageArrays = await runWithConcurrencyLimit(tasks, concurrency);
    return pageArrays.flat();
}

/** 加载单篇文章的详情内容 */
export async function loadArticleDetail(articleId, pattern) {
    const url = pattern.replace('{id}', articleId);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`详情加载失败: ${url}`);
    return response.json(); // { contentHtml: "..." }
}