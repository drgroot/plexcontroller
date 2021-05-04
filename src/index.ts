import rabbitMQ from './com/rabbitmq';
import { QUEUE_NAME } from './com/config';
import migrate from './com/db/migrate';
import {
  critical, info, error,
} from './com/log';
import Worker from './worker';

process.on(
  'unhandledRejection',
  (e: Error) => critical('unhandled rejection', e.message || e)
    .then(() => error('unhandled rejection', e))
    .catch(() => true),
);

const consumer = (queueName = QUEUE_NAME) => rabbitMQ
  .consume({
    queueName,
    prefetch: parseInt(process.env.PREFETCH || '3', 10) || 3,
    onMessage: (msg, channel, body) => Worker(body)
      .then((isSuccess) => {
        if (msg) {
          if (isSuccess) {
            info('onmsg', 'Successfully processed message');
            channel.ack(msg);
          } else {
            error('onmsg', 'Unsuccessfully processed message');
            channel.nack(msg);
          }
        }
      }),
    consumeCallback: () => info('Awaiting tasks on', queueName),
  });

if (require.main === module) {
  migrate()
    .then(() => consumer());
}

export default consumer;
