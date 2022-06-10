/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2022 GIP SmartMercial GmbH, Germany
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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoDeploymentItem } from './xo-deployment-item.model';
import { XoExceptionInformation } from './xo-exception-information.model';


@XoObjectClass(null, 'xmcp.factorymanager.deploymentitems', 'UndeployDeploymentItemResult')
export class XoUndeployDeploymentItemResult extends XoObject {


    @XoProperty()
    success: boolean;


    @XoProperty(XoDeploymentItem)
    deploymentItem: XoDeploymentItem = new XoDeploymentItem();


    @XoProperty(XoExceptionInformation)
    exceptionInformation: XoExceptionInformation = new XoExceptionInformation();


}

@XoArrayClass(XoUndeployDeploymentItemResult)
export class XoUndeployDeploymentItemResultArray extends XoArray<XoUndeployDeploymentItemResult> {
}
