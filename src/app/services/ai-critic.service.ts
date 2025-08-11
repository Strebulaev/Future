import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AICriticService {
  private readonly TOGETHER_API_URL = 'https://api.together.xyz/v1/completions';
  private readonly API_KEY = 'tgp_v1_yCkYhRMbF3fRCx_BfsGyiLsVPdj4CovE4Qw7sBaIfsw'; // Замени на свой ключ

  constructor(private http: HttpClient) {}

  async criticizePlan(plan: string): Promise<string> {
    const prompt = `
      Разнеси этот план в хлам. Будь максимально жёстким и саркастичным. Укажи на все косяки:
      ${plan}
    `;

    const response = await this.http.post<any>(this.TOGETHER_API_URL, {
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      prompt,
      max_tokens: 1000,
      temperature: 0.9
    }).toPromise();

    return response.choices[0].text;
  }
}