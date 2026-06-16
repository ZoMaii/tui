/**
 * 异步加载文章数据
 */
export async function loadArticles() {
    const response = await fetch('../articles.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('数据格式错误：期望数组');
    return data;
}