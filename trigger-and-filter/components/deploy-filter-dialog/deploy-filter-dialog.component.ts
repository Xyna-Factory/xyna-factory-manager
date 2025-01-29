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
import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcDialogService, XcOptionItem, XcOptionItemString } from '@zeta/xc';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { XoFilterInstance } from '@fman/trigger-and-filter/xo/xo-filter-instance.model';
import { XoDeployFilterRequest } from '@fman/trigger-and-filter/xo/xo-deploy-filter-request.model';
import { XoFilter } from '@fman/trigger-and-filter/xo/xo-filter.model';
import { XoRuntimeContext, XoRuntimeContextArray } from '@fman/runtime-contexts/xo/xo-runtime-context.model';
import { XoTriggerInstance, XoTriggerInstanceArray } from '@fman/trigger-and-filter/xo/xo-trigger-instance.model';



@Component({
    templateUrl: './deploy-filter-dialog.component.html',
    styleUrls: ['./deploy-filter-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DeployFilterDialogComponent extends XcDialogComponent<XoFilterInstance, XoFilter> {

    instance: string;
    parameter: string;
    documentation: string;
    optional: boolean;
    busy: boolean;

    context: XoRuntimeContext = this.injectedData.runtimeContext;
    triggerInstance: string;

    runtimeContextDataWrapper: XcAutocompleteDataWrapper<XoRuntimeContext> = new XcAutocompleteDataWrapper<XoRuntimeContext>(
        () => this.context,
        value => {
            this.context = value;
            this.fillTriggerInstanceWrapper();
        });

    triggerInstanceDataWrapper: XcAutocompleteDataWrapper<string> = new XcAutocompleteDataWrapper<string>(
        () => this.triggerInstance,
        value => {
            this.triggerInstance = value;
        });

    constructor(injector: Injector,
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService) {
        super(injector);

        this.fillContextWrapper();
        this.fillTriggerInstanceWrapper();
    }

    fillContextWrapper() {
        this.apiService.startOrderAssertFlat<XoRuntimeContext>(FM_RTC, ORDER_TYPES.POSSIBLE_CONTEXT_FILTER, this.injectedData, XoRuntimeContextArray)
            .subscribe({
                next: result => {
                    this.runtimeContextDataWrapper.values = result.map(rtc => <XcOptionItem<XoRuntimeContext>>{ name: rtc.label, value: rtc });
                },
                error: err => {
                    this.dialogService.error(err);
                }
            });
    }

    fillTriggerInstanceWrapper() {
        this.apiService.startOrderAssertFlat<XoTriggerInstance>(FM_RTC, ORDER_TYPES.POSSIBLE_TRIGGER_INSTANCES, [this.injectedData, this.context], XoTriggerInstanceArray)
            .subscribe({
                next: result => {
                    this.triggerInstanceDataWrapper.values = result.map(triggerInstance => XcOptionItemString(triggerInstance.triggerInstance));
                },
                error: err => {
                    this.dialogService.error(err);
                }
            });
    }

    deploy() {
        this.busy = true;

        const request: XoDeployFilterRequest = new XoDeployFilterRequest();
        request.filterName = this.injectedData.name;
        request.filterInstanceName = this.instance;
        request.runtimeContext = this.context;
        request.triggerInstanceName = this.triggerInstance;
        request.configurationParameter = this.parameter;
        request.documentation = this.documentation;
        request.optional = this.optional;

        this.apiService.startOrder(FM_RTC, ORDER_TYPES.DEPLOY_FILTER, request, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (!result.errorMessage) {
                        const res: XoFilterInstance = new XoFilterInstance();
                        res.filterInstance = this.instance;
                        res.filter = this.injectedData.name;
                        this.dismiss(res);
                    } else {
                        this.dialogService.error(result.errorMessage);
                    }
                },
                error: err => {
                    this.dialogService.error(err);
                },
                complete: () => {
                    this.busy = false;
                }
            });
    }
}
