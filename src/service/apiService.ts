import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default class ApiService {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = this.getServerUrl();
  }
  
  private getServerUrl(): string {
    const configPath = path.join(os.homedir(), '.beacon-config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.serverUrl || 'https://suibeacon-be.onrender.com';
      } catch (error) {
        return 'https://suibeacon-be.onrender.com';
      }
    }
    
    return 'https://suibeacon-be.onrender.com';
  }
  
  async get(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return response.json();
  }
  
  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}