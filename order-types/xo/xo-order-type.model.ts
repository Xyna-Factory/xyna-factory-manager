// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2024 Xyna GmbH, Germany
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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoRuntimeContext, XoUnique } from '@zeta/api';

import { XoDestinationType } from '../../xo/xo-destination-type.model';
import { XoParameterInheritanceRuleArray } from '../../xo/xo-parameter-inheritance-rule.model';
import { XoCapacityArray } from './xo-capacity.model';


@XoObjectClass(null, 'xmcp.factorymanager.ordertypes', 'OrderType')
export class XoOrderType extends XoObject {


    @XoProperty()
    name: string;


    @XoProperty()
    @XoUnique()
    fullQualifiedName: string;


    @XoProperty(XoDestinationType)
    planningDestination: XoDestinationType = new XoDestinationType();


    @XoProperty()
    planningDestinationIsCustom: boolean;


    @XoProperty(XoDestinationType)
    executionDestination: XoDestinationType = new XoDestinationType();


    @XoProperty()
    executionDestinationIsCustom: boolean;


    @XoProperty(XoDestinationType)
    cleanupDestination: XoDestinationType = new XoDestinationType();


    @XoProperty()
    cleanupDestinationIsCustom: boolean;


    @XoProperty(XoCapacityArray)
    requiredCapacities: XoCapacityArray = new XoCapacityArray();


    @XoProperty()
    documentation: string;


    @XoProperty()
    evaluatedMonitoringLevel: number;


    @XoProperty()
    monitoringLevel: string;


    @XoProperty()
    monitoringLevelIsCustom: boolean;


    @XoProperty()
    priority: number;


    @XoProperty()
    priorityIsCustom: boolean;


    @XoProperty()
    application: string;


    @XoProperty()
    version: string;


    @XoProperty(XoRuntimeContext)
    runtimeContext: XoRuntimeContext = new XoRuntimeContext('');


    @XoProperty(XoParameterInheritanceRuleArray)
    parameterInheritanceRules: XoParameterInheritanceRuleArray = new XoParameterInheritanceRuleArray();


    @XoProperty()
    workspace: string;


    @XoProperty()
    usedCapacities: string;


    @XoProperty()
    precedence: number;


    @XoProperty()
    revision: number;


}

@XoArrayClass(XoOrderType)
export class XoOrderTypeArray extends XoArray<XoOrderType> {
}
