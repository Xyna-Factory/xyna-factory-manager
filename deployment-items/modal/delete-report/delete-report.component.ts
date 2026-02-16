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
import { Component, inject } from '@angular/core';

import { I18nService, LocaleService } from '@zeta/i18n';
import { I18nModule } from '@zeta/i18n/i18n.module';
import { XcDialogComponent, XcRichListItem } from '@zeta/xc';
import { XcModule } from '@zeta/xc/xc.module';

import { Subject } from 'rxjs';

import { DeleteDeploymentItemResolution } from '../../restorable-deployment-items.component';
import { XoDeleteDeploymentItemParam, XoDeleteDeploymentItemParamArray } from '../../xo/xo-delete-deployment-item-param.model';
import { XoDeleteDeploymentItemResult, XoDeleteDeploymentItemResultArray } from '../../xo/xo-delete-deployment-item-result.model';
import { DeleteReportItemComponent, DeleteReportItemComponentData } from './delete-report-item/delete-report-item.component';
import { deleteReport_translations_de_DE } from './locale/delete-report-translations.de-DE';
import { deleteReport_translations_en_US } from './locale/delete-report-translations.en-US';


export interface DeleteReportComponentData {
    results: XoDeleteDeploymentItemResultArray;
    i18nService: I18nService;
}

@Component({
    templateUrl: './delete-report.component.html',
    styleUrls: ['./delete-report.component.scss'],
    imports: [XcModule, I18nModule]
})
export class DeleteReportComponent extends XcDialogComponent<XoDeleteDeploymentItemParamArray, DeleteReportComponentData> {
    private readonly i18n = inject(I18nService);


    resultListItems: XcRichListItem<DeleteReportItemComponentData>[] = [];

    selectedResultSubject = new Subject<XoDeleteDeploymentItemResult>();
    selectedResult: XoDeleteDeploymentItemResult;

    get stacktrace(): string {
        return this.selectedResult ? this.selectedResult.exceptionInformation.stacktrace : '';
    }

    constructor() {
        super();

        this.i18n.setTranslations(LocaleService.DE_DE, deleteReport_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, deleteReport_translations_en_US);

        this.updateItems();

        this.selectedResultSubject.subscribe(result => this.selectedResult = result);
    }

    apply() {

        const paramArr = new XoDeleteDeploymentItemParamArray();

        this.resultListItems.forEach(resultListItem => {

            const resolution = resultListItem.data.resolution;

            if (resolution !== DeleteDeploymentItemResolution.SKIP) {

                const param = new XoDeleteDeploymentItemParam();
                param.deploymentItemId = resultListItem.data.result.deploymentItem.id;

                if (resolution === DeleteDeploymentItemResolution.FORCE_DELETE_AND_RECURSIVE_UNDEPLOY) {
                    // in Flash-GUI: 'recursiveUndeploy'
                    param.deleteDependencies = false;
                    param.recursivlyUndeployIfDeployedAndDependenciesExist = true;
                }

                if (resolution === DeleteDeploymentItemResolution.FORCE_RECURSIVE_DELETE) {
                    // in Flash-GUI: 'recursiveDelete'
                    param.deleteDependencies = true;
                    param.recursivlyUndeployIfDeployedAndDependenciesExist = false;
                }

                paramArr.data.push(param);
            }

        });

        this.dismiss(paramArr);

    }

    private updateItems() {

        this.injectedData.results.data.forEach(
            result => {
                const data: XcRichListItem<DeleteReportItemComponentData> = {
                    component: DeleteReportItemComponent,
                    data: {
                        result: result,
                        resolution: DeleteDeploymentItemResolution.SKIP,
                        selectedResultSubject: this.selectedResultSubject,
                        isResultSelected: () => (this.selectedResult === result)
                    },
                    selectable: true
                };
                this.resultListItems.push(data);
            }
        );
    }

}
