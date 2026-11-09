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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty, XoRuntimeContext } from '@zeta/api';

import { XoParameterArray } from './xo-parameter.model';
import { XoSourceType } from './xo-source-type.model';


@XoObjectClass(null, 'xmcp.factorymanager.orderinputsources', 'CreateOrderInputSourceRequest')
export class XoCreateOrderInputSourceRequest extends XoObject {


    @XoProperty()
    name: string;


    @XoProperty()
    orderType: string;


    @XoProperty(XoRuntimeContext)
    runtimeContext: XoRuntimeContext = new XoRuntimeContext('initial instance');


    @XoProperty(XoParameterArray)
    parameter: XoParameterArray = new XoParameterArray();


    @XoProperty(XoSourceType)
    sourceType: XoSourceType = new XoSourceType();


    @XoProperty()
    documentation: string;


}

@XoArrayClass(XoCreateOrderInputSourceRequest)
export class XoCreateOrderInputSourceRequestArray extends XoArray<XoCreateOrderInputSourceRequest> {
}
