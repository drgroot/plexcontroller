import rabbitMQ from '../src/com/rabbitmq';
import Consumer from '../src';

export const queueName = 'testing_queue';

export const sendMsg = (msg: string) => rabbitMQ.publish(queueName, msg);

const consumer = Consumer(queueName);

describe('Simple consuming patterns', () => {
  it('Should consume on queue and reply if required', () => sendMsg('hi'));

  after(() => consumer.disconnect());
});
