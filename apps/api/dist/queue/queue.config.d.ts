import { Queue } from 'bullmq';
import Redis from 'ioredis';
export declare const redis: Redis;
export declare const codeExecutionQueue: Queue<any, any, string, any, any, string>;
export declare const codeSubmissionQueue: Queue<any, any, string, any, any, string>;
