export const formatChatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatChatSenderLine = (msg) => {
    const name = msg.senderName || msg.sender?.name || 'Unknown';
    const zone = msg.senderParkZoneCode || msg.sender?.parkZoneCode || 'N/A';
    const type = msg.senderType || msg.sender?.type || '';
    return `${name} · Zone: ${zone} · ${type}`;
};

export const isOwnChatMessage = (msg, user) =>
    Boolean(msg.sender && user && msg.sender._id === user._id);
