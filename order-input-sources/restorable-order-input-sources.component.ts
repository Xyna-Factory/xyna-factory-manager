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
import { Component, OnInit } from '@angular/core';

import { XoRuntimeContext } from '@zeta/api';
import { LocaleService } from '@zeta/i18n';

import { InputScreenWorkflowPackage, RestorableRouteComponent } from '../restorable-route.component';
import { order_input_sources_translations_de_DE } from './locale/ois-translations.de-DE';
import { order_input_sources_translations_en_US } from './locale/ois-translations.en-US';
import { XoOrderInputSource } from './xo/xo-order-input-source.model';


@Component({
    template: ''
})
export class RestorableOrderInputSourcesComponent extends RestorableRouteComponent<XoOrderInputSource> implements OnInit {

    get UNSPECIFIED_DETAILS_ERROR(): string {
        return this.i18nService.translateSignal('fman.ois.unspecified-details-error')();
    }

    get UNSPECIFIED_ADD_ERROR(): string {
        return this.i18nService.translateSignal('fman.ois.unspecified-add-error')();
    }

    get UNSPECIFIED_SAVE_ERROR(): string {
        return this.i18nService.translateSignal('fman.ois.unspecified-save-error')();
    }

    get CONFIRM_DELETE(): string {
        return this.i18nService.translateSignal('fman.ois.confirm-delete')();
    }

    get UNSPECIFIED_GET_RUNTIME_CONTEXTS_ERROR(): string {
        return this.i18nService.translateSignal('fman.ois.unspecified-get-runtime-contexts-error')();
    }

    get GET_GENERATING_ORDER_TYPES_ERROR(): string {
        return this.i18nService.translateSignal('fman.ois.get-generating-order-types-error')();
    }

    get UNSPECIFIED_GET_ORDER_TYPES_ERROR(): string {
        return this.i18nService.translateSignal('fman.ois.unspecified-get-order-types-error')();
    }

    get UNSPECIFIED_START_FREQUENCY_CONTROLLED_TASK_ERROR(): string {
        return this.i18nService.translateSignal('fman.ois.unspecified-start-frequency-controlled-task-error')();
    }

    constructor() {
        super();

        this.i18nService.setTranslations(LocaleService.DE_DE, order_input_sources_translations_de_DE);
        this.i18nService.setTranslations(LocaleService.EN_US, order_input_sources_translations_en_US);
    }

    ngOnInit() {
        super.ngOnInit();
    }


    protected GET_ORDER_TYPES_EMPTY_LIST_ERROR(context: XoRuntimeContext): string {
        const param = {
            key: '$0',
            value: context.toString()
        };
        return this.i18nService.translate('No order types found in $0', param);
    }


    protected GET_GENERATING_ORDER_TYPES_EMPTY_LIST_ERROR(context: XoRuntimeContext): string {
        const param = {
            key: '$0',
            value: context.toString()
        };
        return this.i18nService.translate('No generating order types found in $0', param);
    }
}

export const ORDER_INPUT_SOURCE_TYPE_CONSTANT_NAME_PREFIX = 'Constant';
export const ORDER_INPUT_SOURCE_TYPE_WORKFLOW_NAME_PREFIX = 'Workflow';
export const ORDER_INPUT_SOURCE_TYPE_XTF_NAME_PREFIX = 'XTF';

export interface OrderInputSourceInputScreenWorkflowPackage extends InputScreenWorkflowPackage {
    GetRuntimeContexts?: string;
    GetOrderSourceTypes?: string;
    GetOrderTypes?: string;
    GetGeneratingOrderTypes?: string;
    StartFrequencyControlledTaskRequest?: string;
}

export const ORDER_INPUT_SOURCE_ISWP: OrderInputSourceInputScreenWorkflowPackage = {
    List: 'xmcp.factorymanager.orderinputsources.GetOrderInputSources',
    Details: 'xmcp.factorymanager.orderinputsources.GetOrderInputSource',
    Add: 'xmcp.factorymanager.orderinputsources.CreateOrderInputSource',
    Save: 'xmcp.factorymanager.orderinputsources.ChangeOrderInputSource',
    Delete: 'xmcp.factorymanager.orderinputsources.DeleteOrderInputSource',
    GetRuntimeContexts: 'xmcp.factorymanager.orderinputsources.GetRuntimeContexts',
    GetOrderSourceTypes: 'xmcp.factorymanager.orderinputsources.GetOrderSourceTypes',
    GetOrderTypes: 'xmcp.factorymanager.shared.GetOrderTypes',
    GetGeneratingOrderTypes: 'xmcp.factorymanager.orderinputsources.GetGeneratingOrderTypes',
    StartFrequencyControlledTaskRequest: 'xmcp.factorymanager.orderinputsources.StartFrequencyControlledTask'
};


export enum OrderInputSourceParameterKey {
    ConstantMonitoringLevel = 'monitoringLevel',
    ConstantCustomField0 = 'customField0',
    ConstantCustomField1 = 'customField1',
    ConstantCustomField2 = 'customField2',
    ConstantCustomField3 = 'customField3',
    ConstantPriority = 'priority',
    ConstantInputData = 'inputData',
    XTFOrderTypeOfGeneratingWorkflow = 'orderTypeOfGeneratingWorkflow',
    XTFTestCaseID = 'testCaseID',
    XTFTestCaseName = 'testCaseName',
    WorkflowGeneratingOrderType = 'generatingOrderType'
}
