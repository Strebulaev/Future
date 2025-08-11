// src/app/services/ai-chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root' // Или конкретный модуль, если используется
})
export class AIChatService {
  private readonly API_URL = 'https://api.together.xyz/v1/chat/completions';
  private readonly API_KEY = 'tgp_v1_yCkYhRMbF3fRCx_BfsGyiLsVPdj4CovE4Qw7sBaIfsw';

  constructor(private http: HttpClient) {}

  async sendMessage(messages: {role: string, content: string}[]): Promise<string> {
    try {
      const response = await this.http.post<any>(this.API_URL, {
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      }, {
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        }
      }).pipe(
        map(res => res.choices[0]?.message?.content || 'Не удалось получить ответ'),
        catchError(err => {
          console.error('API Error:', err);
          return throwError(() => new Error('Ошибка соединения с нейросетью'));
        })
      ).toPromise();

      return response;
    } catch (error) {
      console.error('Chat error:', error);
      return 'Извините, произошла ошибка. Пожалуйста, попробуйте позже.';
    }
  }
}