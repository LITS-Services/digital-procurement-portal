import { Component } from '@angular/core';

@Component({
  selector: 'app-knowledge-question',
  templateUrl: './knowledge-question.component.html',
  styleUrls: ['./knowledge-question.component.scss'],
  standalone: false
})
export class KnowledgeQuestionComponent  {
  isShowQues = false;
  constructor() {}
}
