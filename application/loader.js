// data/loader.js

/**
 * 带并发限制的批量请求工具
 * @param {Array} tasks - 返回 Promise 的函数数组
 * @param {number} limit - 最大并发数
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

// 原有函数不变
export async function loadManifest() {
    const response = await fetch('../data/manifest.json');
    if (!response.ok) throw new Error('Manifest 加载失败');
    return response.json();
}

export async function loadArticlesByPage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`分页数据加载失败: ${url}`);
    return response.json();
}

// 修改：支持并发限制
export async function loadAllArticles(manifest, concurrency = 6) {
    const tasks = manifest.pages.map(url => () => loadArticlesByPage(url));
    const pageArrays = await runWithConcurrencyLimit(tasks, concurrency);
    return pageArrays.flat();
}