/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { Component, Injector } from '@angular/core';

import { RuntimeContext, Xo } from '@zeta/api';
import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent } from '@zeta/xc';

import { workflowTester_translations_de_DE } from './locale/workflow-tester-translations.de-DE';
import { workflowTester_translations_en_US } from './locale/workflow-tester-translations.en-US';


export interface WorkflowTesterData {
    runtimeContext: RuntimeContext;
    orderType: string;
    input?: Xo[];
}


@Component({
    templateUrl: './workflow-tester-dialog.component.html',
    styleUrls: ['./workflow-tester-dialog.component.scss'],
    standalone: false
})
export class WorkflowTesterDialogComponent extends XcDialogComponent<void, WorkflowTesterData> {

    constructor(injector: Injector, private readonly i18nService: I18nService) {
        super(injector);

        this.i18nService.setTranslations(LocaleService.DE_DE, workflowTester_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, workflowTester_translations_en_US);
    }
}
