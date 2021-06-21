import rabbitMQ from './com/rabbitmq';
import {
  queueName,
  exchangeName,
  STARTUP_DELAY,
  controllerMode,
} from './com/config';
import migrate from './com/db/migrate';
import {
  critical, info, error,
} from './com/log';
import type { QueueMessage } from './lib/message';
import SideCar from './sideCar';
import Controller from './controller';
import { sleep } from './lib/lib';

process.on(
  'unhandledRejection',
  (e: Error) => critical('unhandled rejection', e.message || e)
    .then(() => error('unhandled rejection', e))
    .catch(() => true)
    .then(() => process.exit()),
);

interface MessageHandle {
  (message: QueueMessage): Promise<boolean>
}

const consumer = (onMessage: MessageHandle, onConsuming: () => void) => rabbitMQ
  .consume({
    queueName,
    routingKey: controllerMode ? queueName : '',
    exchangeName: controllerMode ? '' : exchangeName,
    onMessage: (msg, channel, body: QueueMessage) => {
      if (msg) {
        onMessage(body)
          .then((isSuccess) => {
            if (isSuccess) {
              info('onmsg', 'Successfully processed message');
              channel.ack(msg);
            } else {
              error('onmsg', 'Unsuccessfully processed message');
              channel.nack(msg);
            }
          });
      }
    },
    consumeCallback: () => {
      info(
        'Awaiting tasks on',
        queueName,
        'bound to',
        controllerMode ? queueName : '',
        'on exchange',
        controllerMode ? '' : exchangeName,
      );
      onConsuming();
    },
  });

if (require.main === module) {
  migrate()
    .then(() => sleep(parseInt(STARTUP_DELAY, 10)))
    .then(() => {
      const Worker = controllerMode ? Controller : SideCar;
      const worker = new Worker();
      return consumer(worker.onMessage, worker.onConsuming);
    });
}

export default consumer;
