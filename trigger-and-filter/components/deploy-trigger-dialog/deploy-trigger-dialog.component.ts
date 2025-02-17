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

import { ApiService, StartOrderOptionsBuilder } from '@zeta/api';
import { XcAutocompleteDataWrapper, XcDialogComponent, XcDialogService, XcOptionItem } from '@zeta/xc';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { XoTrigger } from '@fman/trigger-and-filter/xo/xo-trigger.model';
import { XoTriggerInstance } from '@fman/trigger-and-filter/xo/xo-trigger-instance.model';
import { XoDeployTriggerRequest } from '@fman/trigger-and-filter/xo/xo-deploy-trigger-request.model';
import { XoRuntimeContext, XoRuntimeContextArray } from '@fman/runtime-contexts/xo/xo-runtime-context.model';



@Component({
    templateUrl: './deploy-trigger-dialog.component.html',
    styleUrls: ['./deploy-trigger-dialog.component.scss'],
    standalone: false
})
export class DeployTriggerDialogComponent extends XcDialogComponent<XoTriggerInstance, XoTrigger> {

    instance: string;
    parameter: string;
    documentation: string;
    busy: boolean;

    context: XoRuntimeContext = this.injectedData.runtimeContext;

    runtimeContextDataWrapper: XcAutocompleteDataWrapper<XoRuntimeContext> = new XcAutocompleteDataWrapper<XoRuntimeContext>(
        () => this.context,
        value => {
            this.context = value;
        });

    constructor(injector: Injector,
        private readonly apiService: ApiService,
        private readonly dialogService: XcDialogService) {
        super(injector);

        this.fillContextWrapper();
    }

    fillContextWrapper() {
        this.apiService.startOrderAssertFlat<XoRuntimeContext>(FM_RTC, ORDER_TYPES.POSSIBLE_CONTEXT_TRIGGER, this.injectedData, XoRuntimeContextArray)
            .subscribe({
                next: result => {
                    this.runtimeContextDataWrapper.values = result.map(rtc => <XcOptionItem<XoRuntimeContext>>{ name: rtc.label, value: rtc });
                },
                error: err => {
                    this.dialogService.error(err);
                }
            });
    }

    deploy() {

        this.busy = true;

        const request: XoDeployTriggerRequest = new XoDeployTriggerRequest();
        request.triggerName = this.injectedData.name;
        request.triggerInstanceName = this.instance;
        request.runtimeContext = this.context;
        request.startParameter = this.parameter;
        request.documentation = this.documentation;

        this.apiService.startOrder(FM_RTC, ORDER_TYPES.DEPLOY_TRIGGER, request, null, StartOrderOptionsBuilder.defaultOptionsWithErrorMessage)
            .subscribe({
                next: result => {
                    if (!result.errorMessage) {
                        const res: XoTriggerInstance = new XoTriggerInstance();
                        res.triggerInstance = this.instance;
                        res.trigger = this.injectedData.name;
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
