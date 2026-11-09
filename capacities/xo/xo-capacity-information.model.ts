// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoTransient, XoUnique } from '@zeta/api';
import { XcCheckboxTemplate, XcComponentTemplate, XcIdentityDataWrapper, XcStringIntegerDataWrapper, XcTemplate } from '@zeta/xc';

import { CapacityTableInuseTemplateComponent, CapacityTableInuseTemplateData } from '../templates/capacity-table-inuse-template.model';
import { CapacityUsageTemplateComponent, CapacityUsageTemplateData } from '../templates/capacity-usage-template.component';


@XoObjectClass(null, 'xmcp.factorymanager.capacities', 'CapacityInformation')
export class XoCapacityInformation extends XoObject {

    // a static variable to store all selected required capacities for the input screen
    static requiredUniqueKeys = new Map<string, XoCapacityInformation>();

    // a static variable to store all selected required capacities for the add modal of the input screen
    static requiredUniqueKeysAddModal = new Map<string, XoCapacityInformation>();

    // a static flag variable, which tells if the modal is open or not
    static isInModalFlag = false;


    @XoProperty()
    @XoTransient()
    isRequiredTemplate: XcTemplate[];

    @XoProperty()
    @XoUnique()
    name: string;

    @XoProperty()
    state: string;

    @XoProperty()
    cardinality: number;

    @XoProperty()
    inuse: number;

    @XoProperty()
    @XoTransient()
    usage = 1;

    @XoProperty()
    @XoTransient()
    usageTemplate: XcTemplate[];        // to edit inside table

    @XoProperty()
    @XoTransient()
    tableInuseTemplate: XcTemplate[];   // to view inside table

    afterDecode() {
        super.afterDecode();

        const checkboxDataWrapper = new XcIdentityDataWrapper(
            () => XoCapacityInformation.isInModalFlag ? XoCapacityInformation.requiredUniqueKeysAddModal.has(this.uniqueKey) : XoCapacityInformation.requiredUniqueKeys.has(this.uniqueKey),
            (value: boolean) => {
                if (XoCapacityInformation.isInModalFlag) {
                    if (value) {
                        XoCapacityInformation.requiredUniqueKeysAddModal.set(this.uniqueKey, this);
                    } else {
                        XoCapacityInformation.requiredUniqueKeysAddModal.delete(this.uniqueKey);
                    }
                } else if (value) {
                    XoCapacityInformation.requiredUniqueKeys.set(this.uniqueKey, this);
                } else {
                    XoCapacityInformation.requiredUniqueKeys.delete(this.uniqueKey);
                }
            }
        );

        this.isRequiredTemplate = [new XcCheckboxTemplate(checkboxDataWrapper)];

        const inputDataWrapper = new XcStringIntegerDataWrapper(
            () => this.usage,
            val => this.usage = val || 1
        );

        const usageData: CapacityUsageTemplateData = {
            order: this.name,
            cardinality: this.cardinality.toString(),
            usage: inputDataWrapper
        };

        this.usageTemplate = [new XcComponentTemplate(CapacityUsageTemplateComponent, usageData)];

        const inuseData: CapacityTableInuseTemplateData = { isValue: this.inuse, maxValue: this.cardinality };
        this.tableInuseTemplate = [new XcComponentTemplate(CapacityTableInuseTemplateComponent, inuseData)];
    }

}

@XoArrayClass(XoCapacityInformation)
export class XoCapacityInformationArray extends XoArray<XoCapacityInformation> {
}
