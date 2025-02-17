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
import { XcAutocompleteDataWrapper, XcDialogComponent, XcDialogService, XcOptionItem, XDSIconName } from '@zeta/xc';

import { FM_RTC } from '../../../const';
import { ORDER_TYPES } from '../../order-types';
import { XoTrigger } from '@fman/trigger-and-filter/xo/xo-trigger.model';
import { XoTriggerInstance } from '@fman/trigger-and-filter/xo/xo-trigger-instance.model';
import { XoDeployTriggerRequest } from '@fman/trigger-and-filter/xo/xo-deploy-trigger-request.model';
import { XoRuntimeContext, XoRuntimeContextArray } from '@fman/runtime-contexts/xo/xo-runtime-context.model';
import { XoStartParameterDetails, XoStartParameterDetailsArray } from '@fman/trigger-and-filter/xo/xo-start-parameter-details.model';

interface StartParameter {
    key: string;
    value: string;
}


@Component({
    templateUrl: './deploy-trigger-dialog.component.html',
    styleUrls: ['./deploy-trigger-dialog.component.scss']
})
export class DeployTriggerDialogComponent extends XcDialogComponent<XoTriggerInstance, XoTrigger> {

    readonly XDSIconName = XDSIconName;

    instance: string;
    parameter: string;
    documentation: string;
    busy: boolean;
    startParameter: XoStartParameterDetails[];
    legacy: boolean;
    startparameter: {parameter: StartParameter; wrapper: XcAutocompleteDataWrapper<string>}[] = [];

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
        this.getStartParameter();
    }

    deleteStartParameter(index: number) {
        this.startparameter.splice(index, 1);
    }

    appendStartparameter() {
        const param = {key: '', value: ''};
        this.startparameter.push({
            parameter: param,
            wrapper: new XcAutocompleteDataWrapper<string>(
                () => param.key,
                value => {
                    param.key = value;
                },
                this.startParameter.map(para =>
                    <XcOptionItem<string>>{name: para.name, value: para.name}
                )
            )
        });
    }

    private buildStartparameterRequest(): string {
        return this.startparameter.
            filter(para => !!para.parameter.key).
            map(para => para.parameter.key + '=' + para.parameter.value).
            reduce((pre, cur) => pre + ' ' + cur);
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

    getStartParameter() {
        this.apiService.startOrderAssertFlat<XoStartParameterDetails>(FM_RTC, ORDER_TYPES.POSSIBLE_START_PARAMETER_TRIGGER, this.injectedData, XoStartParameterDetailsArray).subscribe({
            next: result => {
                this.startParameter = result;
                this.legacy = result.length > 0 && result[0].lagacyParameterCombination?.length > 0;
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
        request.startParameter = this.legacy ? this.parameter : this.buildStartparameterRequest();
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
