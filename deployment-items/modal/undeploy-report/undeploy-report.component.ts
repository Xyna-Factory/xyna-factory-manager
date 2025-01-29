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

import { I18nService, LocaleService } from '@zeta/i18n';
import { XcDialogComponent, XcRichListItem } from '@zeta/xc';

import { Subject } from 'rxjs';

import { DeployResolution } from '../../restorable-deployment-items.component';
import { XoUndeployDeploymentItemResult, XoUndeployDeploymentItemResultArray } from '../../xo/xo-undeploy-deployment-item-result.model';
import { XoUndeployDeploymentItemParam, XoUndeployDeploymentItemParamArray } from '../../xo/xo-undeployment-deployment-item-param.model';
import { undeployReport_translations_de_DE } from './locale/undeploy-report-translations.de-DE';
import { undeployReport_translations_en_US } from './locale/undeploy-report-translations.en-US';
import { UndeployReportItemComponent, UndeployReportItemComponentData } from './undeploy-report-item/undeploy-report-item.component';


export interface UndeployReportComponentData {
    results: XoUndeployDeploymentItemResultArray;
    i18nService: I18nService;
}

@Component({
    templateUrl: './undeploy-report.component.html',
    styleUrls: ['./undeploy-report.component.scss'],
    standalone: false
})
export class UndeployReportComponent extends XcDialogComponent<XoUndeployDeploymentItemParamArray, UndeployReportComponentData> {

    resultListItems: XcRichListItem<UndeployReportItemComponentData>[] = [];

    selectedResultSubject = new Subject<XoUndeployDeploymentItemResult>();
    selectedResult: XoUndeployDeploymentItemResult;

    get stacktrace(): string {
        return this.selectedResult ? this.selectedResult.exceptionInformation.stacktrace : '';
    }

    constructor(injector: Injector, private readonly i18n: I18nService)  {
        super(injector);

        this.i18n.setTranslations(LocaleService.DE_DE, undeployReport_translations_de_DE);
        this.i18n.setTranslations(LocaleService.EN_US, undeployReport_translations_en_US);

        this.updateItems();

        this.selectedResultSubject.subscribe(result => this.selectedResult = result);
    }

    apply() {

        const paramArr = new XoUndeployDeploymentItemParamArray();

        this.resultListItems.forEach(resultListItem => {

            const resolution = resultListItem.data.resolution;

            if (resolution !== DeployResolution.SKIP) {

                const param = new XoUndeployDeploymentItemParam();
                param.deploymentItemId = resultListItem.data.result.deploymentItem.id;

                if (resolution === DeployResolution.FORCE_UNDEPLOY) {
                    param.undeployDependendObjects = false;
                    param.disableChecks = true;
                }

                if (resolution === DeployResolution.FORCE_RECURSIVE_UNDEPLOY) {
                    param.undeployDependendObjects = true;
                    param.disableChecks = true;
                }

                paramArr.data.push(param);
            }
        });

        this.dismiss(paramArr);

    }

    private updateItems() {

        this.injectedData.results.data.forEach(
            result => {
                const data: XcRichListItem<UndeployReportItemComponentData> = {
                    component: UndeployReportItemComponent,
                    data: {
                        result: result,
                        resolution: DeployResolution.SKIP,
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
