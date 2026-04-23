const emitEvent = (event, payload, options = {}) => {
  if (!global.io) return;

  const { room, rooms = [] } = options;

  if (room) {
    global.io.to(room).emit(event, payload);
    return;
  }

  if (rooms.length) {
    rooms.forEach((name) => {
      global.io.to(name).emit(event, payload);
    });
    return;
  }

  global.io.emit(event, payload);
};

module.exports = { emitEvent };
