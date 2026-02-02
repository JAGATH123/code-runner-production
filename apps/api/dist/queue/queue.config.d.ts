import { Queue } from 'bullmq';
import Redis from 'ioredis';
export declare let redis: Redis;
export declare let codeExecutionQueue: Queue;
export declare let codeSubmissionQueue: Queue;
export declare function initializeQueues(): void;
