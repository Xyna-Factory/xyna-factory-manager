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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoReferenceDirection } from './xo-reference-direction.model';
import { XoRuntimeContext } from './xo-runtime-context.model';


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'GetDependentRTCsRequest')
export class XoGetDependentRTCsRequest extends XoObject {

    @XoProperty(XoRuntimeContext)
    runtimeContext: XoRuntimeContext;

    @XoProperty(XoReferenceDirection)
    referenceDirection: XoReferenceDirection;

    @XoProperty()
    includeUnassigned: boolean;

    @XoProperty()
    includeImplicit: boolean;
}


@XoArrayClass(XoGetDependentRTCsRequest)
export class XoGetDependentRTCsRequestArray extends XoArray<XoGetDependentRTCsRequest> {
}
