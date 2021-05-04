import type { Connection } from 'amqplib';
import RabbitMQ from 'nodejsmq';
import { RABBITMQ_URL } from './config';

const consumer = new RabbitMQ(RABBITMQ_URL || '');
consumer.connection
  .then(
    (conn: Connection) => conn.on('error', (e) => {
      // eslint-disable-next-line no-console
      console.log(e.message || e);
      process.exit(1);
    }),
  );

export default consumer;
