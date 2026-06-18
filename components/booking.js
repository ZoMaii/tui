import { escapeHtml } from '../application/utils/helpers.js';

export function renderEvents(container, events) {
    if (!container) return;
    const now = new Date();
    container.innerHTML = events.length === 0
        ? '<p class="empty-hint">暂无活动，敬请期待！</p>'
        : events.map(e => {
            const eventDate = new Date(e.date);
            const isPast = eventDate < now;
            const isFull = e.booked >= e.seats;
            const status = isPast ? '已结束' : (isFull ? '已满员' : '可预约');
            const statusClass = isPast ? 'event-past' : (isFull ? 'event-full' : 'event-open');
            return `
                <div class="event-item">
                    <div class="event-header">
                        <h3>${escapeHtml(e.title)}</h3>
                        <span class="event-status ${statusClass}">${status}</span>
                    </div>
                    <div class="event-meta">
                        <span><i class="fa fa-calendar"></i> ${escapeHtml(e.date.replace('T', ' '))}</span>
                        <span><i class="fa fa-map-marker"></i> ${escapeHtml(e.location)}</span>
                        <span><i class="fa fa-users"></i> ${e.booked}/${e.seats}</span>
                    </div>
                    <p class="event-desc">${escapeHtml(e.description)}</p>
                    ${!isPast && !isFull ? `<button class="book-btn" data-event-id="${e.id}">立即预约</button>` : ''}
                </div>
            `;
        }).join('');

    // 绑定预约按钮事件（使用事件委托或单独绑定）
    container.querySelectorAll('.book-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.dataset.eventId;
            // 调用预约逻辑（此处仅示例）
            window.showToast?.(`预约活动 ID: ${eventId} (演示)`);
        });
    });
}