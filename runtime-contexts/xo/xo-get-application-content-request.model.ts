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

import { XoRuntimeContext } from './xo-runtime-context.model';


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'GetApplicationContentRequest')
export class XoGetApplicationContentRequest extends XoObject {

    @XoProperty(XoRuntimeContext)
    application: XoRuntimeContext;

    @XoProperty()
    includeUnassigned: boolean;

    @XoProperty()
    includeImplicit: boolean;

    @XoProperty()
    includeIndirect: boolean;

    @XoProperty()
    includeAssigned: boolean;


    static create(application: XoRuntimeContext, includeUnassigned: boolean, includeImplicit: boolean, includeIndirect: boolean, includeAssigned: boolean): XoGetApplicationContentRequest {
        const request = new XoGetApplicationContentRequest();
        request.application = application;
        request.includeUnassigned = includeUnassigned;
        request.includeImplicit = includeImplicit;
        request.includeIndirect = includeIndirect;
        request.includeAssigned = includeAssigned;
        return request;
    }
}


@XoArrayClass(XoGetApplicationContentRequest)
export class XoGetApplicationContentRequestArray extends XoArray<XoGetApplicationContentRequest> {
}
