const cluster = require('cluster');
const cpus = require('os').cpus();
const pino = require('pino');

const log = pino({
  name: process.env.STORM_LOG_NAME || 'Rayo',
  level: process.env.STORM_LOG_LEVEL || 'info',
  prettyPrint: process.env.STORM_LOG_PRETTY === 'true'
});

class Storm {
  constructor(boot, options) {
    this.workers = options.workers || cpus.length;
    this.boot = options.boot || boot;
    this.onMaster = options.onMaster || function bootFn() {};
    this.up = true;
    if (!boot) {
      throw new Error('You need to provide a boot function.');
    }

    this.start();
  }

  start() {
    if (cluster.isWorker) {
      this.boot(cluster.worker.id);
    } else {
      this.onMaster();
      cluster.on('exit', this.revive);
      process.on('SIGINT', this.stop).on('SIGTERM', this.stop);
      for (let i = 0; i < this.workers; i += 1) {
        cluster.fork();
      }
    }
  }

  stop() {
    this.up = false;
    const workers = Object.keys(cluster.workers).length;
    for (let wrk = workers; wrk > 0; wrk -= 1) {
      if (cluster.workers[wrk]) {
        cluster.workers[wrk].process.kill();
        cluster.workers[wrk].kill();
      }
    }

    process.exit();
  }

  revive(worker, code, signal) {
    if (this.up) {
      log.warn(`A worker died: ${worker.process.pid}; ${code} | ${signal}`);
      cluster.fork();
    }
  }
}

module.exports = (boot = null, options = {}) => new Storm(boot, options);
